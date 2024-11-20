import { View, Text, SafeAreaView, FlatList, ScrollView } from "react-native";
import styles from "./styles";
import { commonStyles } from "@/styles/common.style";
import { external } from "@/styles/external.style";
import LocationSearchBar from "@/components/location/location.search.bar";
import color from "@/themes/app.colors";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";


export default function HomeScreen() {

    return (
        <View style={[commonStyles.flexContainer, { backgroundColor: "#fff" }]}>
            <SafeAreaView style={styles.container}>
                <View style={[external.p_5, external.ph_20]}>
                    <Text
                        style={{
                            fontFamily: "TT-Octosquares-Medium",
                            fontSize: 25,
                        }}
                    >
                        Swyft
                    </Text>
                    <LocationSearchBar />
                </View>
                <View></View>
            </SafeAreaView>
        </View>
    );
}