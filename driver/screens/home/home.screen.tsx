import {FlatList, Modal, Text, TouchableOpacity, View,} from "react-native";
import React, {useEffect, useState} from "react";
import Header from "@/components/common/header";
import {recentRidesData, rideData} from "@/configs/constants";
import {useTheme} from "@react-navigation/native";
import RenderRideItem from "@/components/ride/render.ride.item";
import {external} from "@/styles/external.style";
import styles from "./styles";
import RideCard from "@/components/ride/ride.card";
import MapView, {Marker} from "react-native-maps";
import {windowHeight, windowWidth} from "@/themes/app.constant";
import {Gps, Location} from "@/utils/icons";
import color from "@/themes/app.colors";
import Button from "@/components/common/button";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as GeoLocation from "expo-location";
import {Toast} from "react-native-toast-notifications";
import {useGetDriverData} from "@/hooks/useGetDriverData";

export default function HomeScreen() {
    const { driver, loading: DriverDataLoading } = useGetDriverData();
    const [loading, setLoading] = useState(false);
    const [isOn, setIsOn] = useState<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [region, setRegion] = useState<any>({
        latitude: 21.005036,
        longitude: 105.845543,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [distance, setDistance] = useState<any>();
    const [wsConnected, setWsConnected] = useState(false);
    const [marker, setMarker] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [lastLocation, setLastLocation] = useState<any>(null);
    const ws = new WebSocket("ws://192.168.1.2:8080");

    const { colors } = useTheme();

    useEffect(() => {
        const fetchStatus = async () => {
            const status: any = await AsyncStorage.getItem("status");
            setIsOn(status === "active");
        };
        fetchStatus();
    }, []);

    useEffect(() => {
        ws.onopen = () => {
            console.log("Connected to WebSocket server");
            setWsConnected(true);
        };

        ws.onmessage = (e) => {
            const message = JSON.parse(e.data);
            console.log("Received message:", message);
            // Handle received location updates here
        };

        ws.onerror = (e: any) => {
            console.log("WebSocket error:", e.message);
        };

        ws.onclose = (e) => {
            console.log("WebSocket closed:", e.code, e.reason);
        };

        return () => {
            ws.close();
        };
    }, []);

    const haversineDistance = (coords1: any, coords2: any) => {
        const toRad = (x: any) => (x * Math.PI) / 180;

        const R = 6371e3; // Radius of the Earth in meters
        const lat1 = toRad(coords1.latitude);
        const lat2 = toRad(coords2.latitude);
        const deltaLat = toRad(coords2.latitude - coords1.latitude);
        const deltaLon = toRad(coords2.longitude - coords1.longitude);

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const sendLocationUpdate =  (location: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: "locationUpdate",
                data: location,
                role: "driver",
                driver: driver?.id,
            });
            ws.send(message);
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await GeoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Toast.show("Please give us to access your location");
                return;
            }

            await GeoLocation.watchPositionAsync(
                {
                    accuracy: GeoLocation.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = { latitude, longitude };
                    // if (
                    //     !lastLocation ||
                    //     haversineDistance(lastLocation, newLocation) > 200
                    // ) {
                        setCurrentLocation(newLocation);
                        // setLastLocation(newLocation);
                        if (ws.readyState === WebSocket.OPEN) {
                            sendLocationUpdate(newLocation);
                        }
                    // }
                }
            );
        })();
    }, []);

    const handleClose = () => {
        setIsModalVisible(false);
    }

    const handleStatusChange = async () => {
        if (!loading) {
            setLoading(true);
            const accessToken = await AsyncStorage.getItem("accessToken");
            const changeStatus = await axios.put(
                `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/update-status`,
                {
                    status: !isOn ? "active" : "inactive",
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (changeStatus.data) {
                setIsOn(!isOn);
                await AsyncStorage.setItem("status", changeStatus.data.driver.status);
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
    };

    return (
        <View style={[external.fx_1]}>
            <View style={styles.spaceBelow}>
                <Header isOn={isOn} toggleSwitch={handleStatusChange} />
                <FlatList
                    data={rideData}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <RenderRideItem item={item} colors={colors} />
                    )}
                />
                <View style={[styles.rideContainer, { backgroundColor: colors.card }]}>
                    <Text
                        style={[styles.rideTitle, { color: colors.text }]}
                        onPress={() => setIsModalVisible(true)}
                    >
                        Recent Rides
                    </Text>
                    <FlatList
                        data={recentRidesData}
                        renderItem={({ item }) =>
                            <RideCard item={item} />
                        }
                    />
                </View>
            </View>
            <Modal
                transparent={true}
                visible={isModalVisible}
                onRequestClose={handleClose}
            >
                <TouchableOpacity style={styles.modalBackground} activeOpacity={1}>
                    <TouchableOpacity style={styles.modalContainer} activeOpacity={1}>
                        <View>
                            <Text style={styles.modalTitle}>New Ride Request!</Text>
                            <MapView
                                style={{ height: windowHeight(180) }}
                                region={region}
                                onRegionChangeComplete={(region) => setRegion(region)}
                            >
                                {marker && <Marker coordinate={marker} />}
                                {currentLocation && <Marker coordinate={currentLocation} />}
                                {/*{routeCoordinates && (*/}
                                {/*    <Polyline*/}
                                {/*        coordinates={routeCoordinates.polyline.map(([latitude, longitude]: [any, any]) => ({*/}
                                {/*            latitude,*/}
                                {/*            longitude,*/}
                                {/*        }))}*/}
                                {/*        strokeWidth={4}*/}
                                {/*        strokeColor="blue"*/}
                                {/*    />*/}
                                {/*)}*/}
                            </MapView>
                            <View style={{ flexDirection: "row" }}>
                                <View style={styles.leftView}>
                                    <Location color={colors.text} />
                                    <View
                                        style={[
                                            styles.verticaldot,
                                            { borderColor: color.buttonBg },
                                        ]}
                                    />
                                    <Gps colors={colors.text} />
                                </View>
                                <View style={styles.rightView}>
                                    <Text style={[styles.pickup, { color: colors.text }]}>
                                        Minh Khai, Vĩnh Tuy, Hai Bà Trưng, Hanoi
                                    </Text>
                                    <View style={styles.border} />
                                    <Text style={[styles.drop, { color: colors.text }]}>
                                        Lý Thái Tổ, Hoàn Kiếm, Hanoi
                                    </Text>
                                </View>
                            </View>
                            <Text
                                style={{
                                    paddingTop: windowHeight(5),
                                    fontSize: windowHeight(14),
                                }}
                            >
                                Distance: 5.4 km
                            </Text>
                            <Text
                                style={{
                                    paddingVertical: windowHeight(5),
                                    paddingBottom: windowHeight(5),
                                    fontSize: windowHeight(14),
                                }}
                            >
                                Amount: 60,000 VND
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    marginVertical: windowHeight(5),
                                }}
                            >
                                <Button
                                    title="Decline"
                                    onPress={handleClose}
                                    width={windowWidth(120)}
                                    height={windowHeight(30)}
                                    backgroundColor="crimson"
                                />
                                <Button
                                    title="Accept"
                                    onPress={() => {}}
                                    width={windowWidth(120)}
                                    height={windowHeight(30)}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>

            </Modal>
        </View>
    );
}