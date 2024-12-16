import {
    View,
    Text,
    FlatList,
    Modal,
    TouchableOpacity,
    Platform,
    ScrollView,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/common/header";
import { recentRidesData, rideData } from "@/configs/constants";
import { useTheme } from "@react-navigation/native";
import RenderRideItem from "@/components/ride/render.ride.item";
import { external } from "@/styles/external.style";
import styles from "./styles";
import RideCard from "@/components/ride/ride.card";
import MapView, { Marker, Polyline } from "react-native-maps";
import { decode } from '@here/flexpolyline';
import { windowHeight, windowWidth } from "@/themes/app.constant";
import { Gps, Location } from "@/utils/icons";
import color from "@/themes/app.colors";
import Button from "@/components/common/button";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as GeoLocation from "expo-location";
import { Toast } from "react-native-toast-notifications";
import { useGetDriverData } from "@/hooks/useGetDriverData";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { router } from "expo-router";

export default function HomeScreen() {
    const notificationListener = useRef<any>();
    const { driver, loading: DriverDataLoading } = useGetDriverData();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isOn, setIsOn] = useState<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [region, setRegion] = useState<any>({
        latitude: 21.005036,
        longitude: 105.845543,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [currentLocationName, setCurrentLocationName] = useState("");
    const [destinationLocationName, setDestinationLocationName] = useState("");
    const [distance, setDistance] = useState<any>();
    const [routeCoordinates, setRouteCoordinates] = useState<any>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [marker, setMarker] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [lastLocation, setLastLocation] = useState<any>(null);
    const [recentRides, setRecentRides] = useState([]);
    const ws = new WebSocket("ws://192.168.1.2:8080");

    const { colors } = useTheme();

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            try {
                const orderData = notification.request.content.data.orderData;

                if (!orderData || !orderData.currentLocation || !orderData.marker) {
                    throw new Error("Invalid order data received");
                }

                setIsModalVisible(true);
                setCurrentLocation({
                    latitude: orderData.currentLocation.latitude,
                    longitude: orderData.currentLocation.longitude,
                });
                setMarker({
                    latitude: orderData.marker.latitude,
                    longitude: orderData.marker.longitude,
                });
                setRegion({
                    latitude: (orderData.currentLocation.latitude + orderData.marker.latitude) / 2,
                    longitude: (orderData.currentLocation.longitude + orderData.marker.longitude) / 2,
                    latitudeDelta: Math.abs(orderData.currentLocation.latitude - orderData.marker.latitude) * 2,
                    longitudeDelta: Math.abs(orderData.currentLocation.longitude - orderData.marker.longitude) * 2,
                });
                setDistance(orderData.distance);
                setCurrentLocationName(orderData.currentLocationName);
                setDestinationLocationName(orderData.destinationLocation);
                setUserData(orderData.user);

                const coordinates = decode(orderData.encodedPolyline);
                setRouteCoordinates(coordinates);
            } catch (error) {
                console.error("Error handling notification:", error);
            }
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
        };
    }, []);

    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    async function registerForPushNotificationsAsync() {
        if (Device.isDevice) {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== "granted") {
                Toast.show("Failed to get push token for push notification!", {
                    type: "danger",
                });
                return;
            }
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;
            if (!projectId) {
                Toast.show("Failed to get project id for push notification!", {
                    type: "danger",
                });
            }
            try {
                const pushTokenString = (
                    await Notifications.getExpoPushTokenAsync({
                        projectId,
                    })
                ).data;
                console.log(pushTokenString);
                // return pushTokenString;
            } catch (e: unknown) {
                Toast.show(`${e}`, {
                    type: "danger",
                });
            }
        } else {
            Toast.show("Must use physical device for Push Notifications", {
                type: "danger",
            });
        }

        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }
    }

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

    const sendLocationUpdate = async (location: any) => {
        const accessToken = await AsyncStorage.getItem("accessToken");
        await axios
            .get(`${process.env.EXPO_PUBLIC_SERVER_URI}/driver/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((res) => {
                if (res.data) {
                    if (ws.readyState === WebSocket.OPEN) {
                        const message = JSON.stringify({
                            type: "locationUpdate",
                            data: location,
                            role: "driver",
                            driver: res.data.driver.id!,
                        });
                        ws.send(message);
                    }
                }
            })
            .catch((error) => {
                console.log(error);
            });
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
                    if (
                        !lastLocation ||
                        haversineDistance(lastLocation, newLocation) > 200
                    ) {
                        setCurrentLocation(newLocation);
                        setLastLocation(newLocation);
                        if (ws.readyState === WebSocket.OPEN) {
                            sendLocationUpdate(newLocation);
                        }
                    }
                }
            );
        })();
    }, []);

    const getRecentRides = async () => {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const res = await axios.get(
            `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/get-rides`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        setRecentRides(res.data.rides);
    };

    useEffect(() => {
        getRecentRides();
    }, []);

    const handleClose = () => {
        setIsModalVisible(false);
    };

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

    const sendPushNotification = async (expoPushToken: string, data: any) => {
        const message = {
            to: expoPushToken,
            sound: "default",
            title: "Ride Request Accepted!",
            body: `Your driver is on the way!`,
            data: { orderData: data },
        };
        await axios
            .post("https://exp.host/--/api/v2/push/send", message)
            .catch((error) => {
                console.log(error);
            });
    };

    const acceptRideHandler = async () => {
        console.log("Accept button pressed");
        const accessToken = await AsyncStorage.getItem("accessToken");
        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/new-ride`,
                {
                    userId: userData?.id!,
                    charge: (distance ? (distance / 1000) * 9000 : 0).toFixed(2),
                    status: "Processing",
                    currentLocationName,
                    destinationLocationName,
                    distance,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            console.log("Ride created:", response.data);

            const data = {
                ...driver,
                currentLocation,
                marker,
                distance,
                routeCoordinates,
            };
            const driverPushToken = "ExponentPushToken[G53H5vIB_Ldk7xrFt-fgX0]";

            await sendPushNotification(driverPushToken, data);

            const rideData = {
                user: userData,
                currentLocation,
                marker,
                driver,
                distance,
                routeCoordinates,
                rideData: response.data.newRide,
            };
            console.log("Navigating to ride details with data:", rideData);
            router.push({
                pathname: "/(routes)/ride-details",
                params: { orderData: JSON.stringify(rideData) },
            });
        } catch (error) {
            console.error("Error accepting ride:", error);
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
                    <ScrollView
                        style={{
                            paddingBottom: windowHeight(20),
                            height: windowHeight(280),
                        }}
                    >
                        {recentRides?.map((item: any, index: number) => (
                            <RideCard item={item} key={index} />
                        ))}
                        {recentRides?.length === 0 && (
                            <Text>You didn't take any ride yet!</Text>
                        )}
                    </ScrollView>
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
                                {routeCoordinates && (
                                    <Polyline
                                        coordinates={routeCoordinates.polyline.map(([latitude, longitude]: [any, any]) => ({
                                            latitude,
                                            longitude,
                                        }))}
                                        strokeWidth={4}
                                        strokeColor="blue"
                                    />
                                )}
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
                                        {currentLocationName}
                                    </Text>
                                    <View style={styles.border} />
                                    <Text style={[styles.drop, { color: colors.text }]}>
                                        {destinationLocationName}
                                    </Text>
                                </View>
                            </View>
                            <Text
                                style={{
                                    paddingTop: windowHeight(5),
                                    fontSize: windowHeight(14),
                                }}
                            >
                                Distance: {(distance / 1000).toFixed(2)} km
                            </Text>
                            <Text
                                style={{
                                    paddingVertical: windowHeight(5),
                                    paddingBottom: windowHeight(5),
                                    fontSize: windowHeight(14),
                                }}
                            >
                                Price: {(distance ? (distance / 1000) * 9000 : 0)} VND
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
                                    onPress={() => acceptRideHandler()}
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
