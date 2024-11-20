import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Dimensions,
    Pressable,
    Image,
    TextInput,
    FlatList, ScrollView,
} from "react-native";
import styles from "./styles";
import { external } from "@/styles/external.style";
import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import {LeftArrow} from "@/assets/icons/leftarrows";
import {router} from "expo-router";
import {Clock} from "@/assets/icons/clock";
import DownArrow from "@/assets/icons/downArrow";
import color from "@/themes/app.colors";
import {PickLocation} from "@/assets/icons/pickLocation";
import PlaceHolder from "@/assets/icons/placeHolder";
import {PickUpLocation} from "@/assets/icons/pickUpLocation";
import axios from "axios";
import _ from "lodash";
import * as Location from "expo-location";
import {Toast} from "react-native-toast-notifications";

export default function RidePlanScreen() {
    const [places, setPlaces] = useState<any>([]);
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState<any>({
        latitude: 21.005036,
        longitude: 105.845543,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [marker, setMarker] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [distance, setDistance] = useState<any>(null);
    const [locationSelected, setLocationSelected] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState("Car");
    const [travelTimes, setTravelTimes] = useState({
        car: null,
        scooter: null,
    });
    const [keyboardAvoidingHeight, setKeyboardAvoidingHeight] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Toast.show(
                    "Please approve your location!",
                    {
                        type: "danger",
                        placement: "bottom",
                    }
                );
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        })();
    }, []);

    const fetchPlaces = async (input: string) => {
        console.log(input)
        try {
            const response = await axios.get(
                `https://autocomplete.search.hereapi.com/v1/autocomplete`,
                {
                    params: {
                        q: input,
                        in: "countryCode:VNM",
                        apiKey: process.env.EXPO_PUBLIC_HERE_API_KEY,
                    },
                }
            );
            console.log(response);

            const mappedPlaces = response.data.items.map((item: { id: any; address: { label: any; }; }) => ({
                id: item.id,
                label: item.address.label,
            }));

            setPlaces(mappedPlaces);
        } catch (error) {
            console.error("Error fetching places:", error);
        }
    };


    const debouncedFetchPlaces = useCallback(_.debounce(fetchPlaces, 100), []);

    useEffect(() => {
        if (query.length > 2) {
            debouncedFetchPlaces(query);
        } else {
            setPlaces([]);
        }
    }, [query, debouncedFetchPlaces]);

    const handleInputChange = (text: any) => {
        setQuery(text);
    };

    const fetchTravelTimes = async (origin: any, destination: any) => {
        const modes = ["car", "scooter"];
        let travelTimes = {
            car: null,
            scooter: null,
        } as any;

        for (const mode of modes) {
            let params = {
                transportMode: mode,
                origin: `${origin.latitude},${origin.longitude}`,
                destination: `${destination.latitude},${destination.longitude}`,
                return: "summary",
                apiKey: process.env.EXPO_PUBLIC_HERE_API_KEY!,
            } as any

            if (mode === "car") {
                params.departure_time = "now";
            }

            try {
                const response = await axios.get(
                    `https://router.hereapi.com/v8/routes`,
                    { params },
                );

                if (response.data.routes.length > 0) {
                    const route = response.data.routes[0];
                    travelTimes[mode] = `${Math.round(route.sections[0].summary.duration / 60)} mins`;
                }
            } catch (error: any) {
                console.error(`Error fetching ${mode} travel time:`, error.message);
            }
        }

        setTravelTimes(travelTimes);
    };


    const handlePlaceSelect = async (placeId: any) => {
        try {
            const response = await axios.get(
                `https://lookup.search.hereapi.com/v1/lookup`,
                {
                    params: {
                        id: placeId,
                        apiKey: process.env.EXPO_PUBLIC_HERE_API_KEY,
                    },
                }
            );

            const { lat, lng } = response.data.position;

            const selectedDestination = { latitude: lat, longitude: lng };
            setRegion({
                ...region,
                latitude: lat,
                longitude: lng,
            });
            setMarker({
                latitude: lat,
                longitude: lng,
            });
            setPlaces([]);
            // requestNearbyDrivers();
            setLocationSelected(true);
            setKeyboardAvoidingHeight(false);

            if (currentLocation) {
                await fetchTravelTimes(currentLocation, selectedDestination);
            }
        } catch (error: any) {
            console.error("Error fetching place details:", error.message);
        }
    };


    return (
        <KeyboardAvoidingView
            style={[external.fx_1]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View>
                <View
                    style={{ height: windowHeight(!keyboardAvoidingHeight ? 500 : 300) }}
                >
                    <MapView
                        style={{ flex: 1 }}
                        region={region}
                        onRegionChangeComplete={(region) => setRegion(region)}
                    >
                        {marker && <Marker coordinate={marker} />}
                        {currentLocation && <Marker coordinate={currentLocation} />}
                        {currentLocation && marker && (
                            <MapViewDirections
                                origin={currentLocation}
                                destination={marker}
                                apikey={process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY!}
                                strokeWidth={4}
                                strokeColor="blue"
                                onError={(error) => console.log(error)}
                            />
                        )}
                    </MapView>
                </View>
            </View>
            <View style={styles.contentContainer}>
                <View style={[styles.container]}>
                    {
                        locationSelected ? (
                            <ScrollView
                                style={{
                                    paddingBottom: windowHeight(20),
                                    height: windowHeight(280),
                                }}
                            >
                                <View
                                    style={{
                                        borderBottomWidth: 1,
                                        borderBottomColor: "#b5b5b5",
                                        paddingBottom: windowHeight(10),
                                        flexDirection: "row",
                                    }}
                                >
                                    <Pressable onPress={() => setLocationSelected(false)}>
                                        <LeftArrow />
                                    </Pressable>
                                    <Text
                                        style={{
                                            margin: "auto",
                                            fontSize: 20,
                                            fontWeight: "600",
                                        }}
                                    >
                                        Gathering options
                                    </Text>
                                </View>
                                <View style={{ padding: windowWidth(10) }}>
                                    <Pressable
                                        style={{
                                            width: windowWidth(420),
                                            borderWidth:
                                                selectedVehicle === "car" ? 2 : 0,
                                            borderRadius: 10,
                                            padding: 10,
                                            marginVertical: 5,
                                        }}
                                        onPress={() => {
                                            setSelectedVehicle("car");
                                        }}
                                    >
                                        <View style={{ margin: "auto" }}>
                                            <Image
                                                source={require("@/assets/images/vehicles/car.png")}
                                                style={{ width: 90, height: 80 }}
                                            />
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <View>
                                                <Text style={{ fontSize: 20, fontWeight: "600" }}>
                                                    Swyft Car
                                                </Text>
                                                <Text style={{ fontSize: 16 }}>
                                                    20 minutes drop off
                                                </Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                </View>
                            </ScrollView>
                        ) : (
                            <>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity onPress={() => router.back()}>
                                        <LeftArrow />
                                    </TouchableOpacity>
                                    <Text
                                        style={{
                                            margin: "auto",
                                            fontSize: windowWidth(25),
                                            fontWeight: "600",
                                        }}
                                    >
                                        Plan your ride
                                    </Text>
                                </View>
                                    {/* picking up time */}
                                        <View
                                        style={{
                                        width: windowWidth(200),
                                        height: windowHeight(28),
                                        borderRadius: 20,
                                        backgroundColor: color.lightGray,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginVertical: windowHeight(10),
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Clock />
                                        <Text
                                            style={{
                                                fontSize: windowHeight(12),
                                                fontWeight: "600",
                                                paddingHorizontal: 8,
                                            }}
                                        >
                                            Pick-up now
                                        </Text>
                                        <DownArrow />
                                    </View>
                                </View>
                                {/* picking up location */}
                                <View
                                    style={{
                                        borderWidth: 2,
                                        borderColor: "#000",
                                        borderRadius: 15,
                                        marginBottom: windowHeight(15),
                                        paddingHorizontal: windowWidth(15),
                                        paddingVertical: windowHeight(5),
                                    }}
                                >
                                    <View style={{
                                        flexDirection: "row",
                                        paddingVertical: 12,
                                    }}>
                                        <PickLocation />
                                        <View
                                            style={{
                                                width: Dimensions.get("window").width - 110,
                                                borderBottomWidth: 1,
                                                borderBottomColor: "#999",
                                                marginLeft: 5,
                                                height: windowHeight(25),
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "#2371F0",
                                                    fontSize: 18,
                                                    paddingLeft: 5,
                                                }}
                                            >
                                                Current Location
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            paddingVertical: 12,
                                        }}
                                    >
                                        <PlaceHolder />
                                        <View
                                            style={{
                                                marginLeft: 5,
                                                width: Dimensions.get("window").width - 110,
                                            }}
                                        >
                                            <TextInput
                                                placeholder="Where to?"
                                                style={{
                                                    height: 38,
                                                    color: "#000",
                                                    fontSize: 16,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: "#999",
                                                    padding: 8,
                                                }}
                                                value={query}
                                                onChangeText={(text) => {
                                                    handleInputChange(text);
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                                {/* Last sessions */}
                                <FlatList
                                    data={places}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: windowHeight(20),
                                            }}
                                            onPress={() => handlePlaceSelect(item.id)}
                                        >
                                            <PickUpLocation />
                                            <Text style={{ padding: 10, fontSize: 16 }}>
                                                {item.label}
                                            </Text>
                                        </Pressable>
                                    )}
                                />
                            </>
                        )
                    }
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}