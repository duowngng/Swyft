import { View, Text, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { fontSizes, windowHeight, windowWidth } from "@/themes/app.constant";
import MapView, { Marker, Polyline } from "react-native-maps";
import color from "@/themes/app.colors";
import Button from "@/components/common/button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Toast } from "react-native-toast-notifications";

export default function RideDetailsScreen() {
    const { orderData: orderDataObj } = useLocalSearchParams() as any;
    const [orderStatus, setOrderStatus] = useState("Processing");
    const orderData = JSON.parse(orderDataObj);
    const [region, setRegion] = useState<any>({
        latitude: 21.005036,
        longitude: 105.845543,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    useEffect(() => {
        if (orderData?.currentLocation && orderData?.marker) {
            const latitudeDelta =
                Math.abs(
                    orderData.marker.latitude - orderData.currentLocation.latitude
                ) * 2;
            const longitudeDelta =
                Math.abs(
                    orderData.marker.longitude - orderData.currentLocation.longitude
                ) * 2;

            setRegion({
                latitude:
                    (orderData.marker.latitude + orderData.currentLocation.latitude) / 2,
                longitude:
                    (orderData.marker.longitude + orderData.currentLocation.longitude) /
                    2,
                latitudeDelta: Math.max(latitudeDelta, 0.0922),
                longitudeDelta: Math.max(longitudeDelta, 0.0421),
            });
            setOrderStatus(orderData.rideData.status);
        }
    }, []);

    const handleSubmit = async () => {
        const accessToken = await AsyncStorage.getItem("accessToken");
        await axios
            .put(
                `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/update-ride-status`,
                {
                    rideStatus: orderStatus === "Ongoing" ? "Completed" : "Ongoing",
                    rideId: orderData?.rideData.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then((res) => {
                if (res.data.updatedRide.status === "Ongoing") {
                    setOrderStatus(res.data.updatedRide.status);
                    Toast.show("Let's have a safe journey!", {
                        type: "success",
                    });
                } else {
                    Toast.show(`Well done ${orderData.driver.name}`);
                    router.push("/(tabs)/home");
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return (
        <View>
            <View style={{ height: windowHeight(480) }}>
                <MapView
                    style={{ flex: 1 }}
                    region={region}
                    onRegionChangeComplete={(region) => setRegion(region)}
                >
                    {orderData?.marker && <Marker coordinate={orderData?.marker} />}
                    {orderData?.currentLocation && (
                        <Marker coordinate={orderData?.currentLocation} />
                    )}
                    {orderData?.routeCoordinates && (
                        <Polyline
                            coordinates={orderData.routeCoordinates.map(([latitude, longitude]: [number, number]) => ({
                                latitude,
                                longitude,
                            }))}
                            strokeWidth={4}
                            strokeColor="blue"
                        />
                    )}
                </MapView>
            </View>
            <View style={{ padding: windowWidth(20) }}>
                <Text
                    style={{
                        fontSize: fontSizes.FONT20,
                        fontWeight: "500",
                        paddingVertical: windowHeight(5),
                    }}
                >
                    Passenger Name: {orderData?.user?.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                        style={{
                            fontSize: fontSizes.FONT20,
                            fontWeight: "500",
                            paddingVertical: windowHeight(5),
                        }}
                    >
                        Phone Number:
                    </Text>
                    <Text
                        style={{
                            color: color.buttonBg,
                            paddingLeft: 5,
                            fontSize: fontSizes.FONT20,
                            fontWeight: "500",
                            paddingVertical: windowHeight(5),
                        }}
                        onPress={() =>
                            Linking.openURL(`tel:${orderData?.user?.phoneNumber}`)
                        }
                    >
                        {orderData?.user?.phoneNumber}
                    </Text>
                </View>
                <Text
                    style={{
                        fontSize: fontSizes.FONT20,
                        fontWeight: "500",
                        paddingVertical: windowHeight(5),
                    }}
                >
                    Price: {((orderData?.distance / 1000) * 9000).toFixed(2)} VND
                </Text>

                <View style={{ paddingTop: windowHeight(30) }}>
                    <Button
                        title={
                            orderStatus === "Processing"
                                ? "Pick Up Passenger"
                                : "Drop Off Passenger"
                        }
                        height={windowHeight(40)}
                        disabled={orderStatus?.length === 0}
                        backgroundColor={color.bgDark}
                        onPress={() => handleSubmit()}
                    />
                </View>
            </View>
        </View>
    );
}
