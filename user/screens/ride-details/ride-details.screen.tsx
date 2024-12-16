import { View, Text, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { fontSizes, windowHeight, windowWidth } from "@/themes/app.constant";
import MapView, { Marker, Polyline } from "react-native-maps";
import color from "@/themes/app.colors";

export default function RideDetailsScreen() {
    const { orderData: orderDataObj } = useLocalSearchParams() as any;
    const orderData = JSON.parse(orderDataObj);
    const [region, setRegion] = useState<any>({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    useEffect(() => {
        if (orderData?.driver?.currentLocation && orderData?.driver?.marker) {
            const latitudeDelta =
                Math.abs(
                    orderData.driver.marker.latitude -
                    orderData.driver.currentLocation.latitude
                ) * 2;
            const longitudeDelta =
                Math.abs(
                    orderData.driver.marker.longitude -
                    orderData.driver.currentLocation.longitude
                ) * 2;

            setRegion({
                latitude:
                    (orderData.driver.marker.latitude +
                        orderData.driver.currentLocation.latitude) /
                    2,
                longitude:
                    (orderData.driver.marker.longitude +
                        orderData.driver.currentLocation.longitude) /
                    2,
                latitudeDelta: Math.max(latitudeDelta, 0.0922),
                longitudeDelta: Math.max(longitudeDelta, 0.0421),
            });
        }
    }, []);

    return (
        <View>
            <View style={{ height: windowHeight(450) }}>
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
                    Driver Name: {orderData?.driver?.name}
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
                            Linking.openURL(`tel:${orderData?.driver?.phoneNumber}`)
                        }
                    >
                        {orderData?.driver?.phoneNumber}
                    </Text>
                </View>
                <Text style={{ fontSize: fontSizes.FONT20, fontWeight: "500" }}>
                    {orderData?.driver?.vehicle_type} Color:{" "}
                    {orderData?.driver?.vehicle_color}
                </Text>
                <Text
                    style={{
                        fontSize: fontSizes.FONT20,
                        fontWeight: "500",
                        paddingVertical: windowHeight(5),
                    }}
                >
                    Price: {((orderData?.driver?.distance / 1000) * 9000).toFixed(2)} VND
                </Text>
                <Text
                    style={{
                        fontSize: fontSizes.FONT14,
                        fontWeight: "400",
                        paddingVertical: windowHeight(5),
                    }}
                >
                    **Pay to your driver after reaching to your destination!
                </Text>
            </View>
        </View>
    );
}