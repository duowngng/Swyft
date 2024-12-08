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
import MapViewDirections from "react-native-maps-directions";
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
    const [isOn, setIsOn] = useState<any>();
    const { colors } = useTheme();

    const toggleSwitch = () => {
        setIsOn(!isOn);
    }

    return (
        <View style={[external.fx_1]}>
            <View style={styles.spaceBelow}>
                <Header isOn={isOn} toggleSwitch={toggleSwitch} />
                <FlatList
                    data={rideData}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <RenderRideItem item={item} colors={colors} />
                    )}
                />
                <View style={[styles.rideContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.rideTitle, { color: colors.text }]}>
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
        </View>
    );
}