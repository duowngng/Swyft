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
    FlatList,
    ScrollView, ActivityIndicator,
} from "react-native";
import styles from "./styles";
import { external } from "@/styles/external.style";
import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import { LeftArrow } from "@/assets/icons/leftarrows";
import { router } from "expo-router";
import { Clock } from "@/assets/icons/clock";
import DownArrow from "@/assets/icons/downArrow";
import color from "@/themes/app.colors";
import { PickLocation } from "@/assets/icons/pickLocation";
import PlaceHolder from "@/assets/icons/placeHolder";
import { PickUpLocation } from "@/assets/icons/pickUpLocation";
import axios from "axios";
import _ from "lodash";
import * as Location from "expo-location";
import { Toast } from "react-native-toast-notifications";
import { decode } from '@here/flexpolyline';
import moment from "moment";
import Button from "@/components/common/button";
import { useGetUserData } from "@/hooks/useGetUserData";

export default function RidePlanScreen() {
    const { user } = useGetUserData();
    const ws = useRef<any>(null);
    const [wsConnected, setWsConnected] = useState(false);
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
    const [travelTime, setTravelTime] = useState({
        car: null,
        scooter: null,
    });
    const [keyboardAvoidingHeight, setKeyboardAvoidingHeight] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<any>(null);
    const [routeSummary, setRouteSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [driverLists, setDriverLists] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState<DriverType>();
    const [driverLoader, setDriverLoader] = useState(true);

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

    const initializeWebSocket = () => {
        ws.current = new WebSocket("ws://192.168.1.2:8080");
        ws.current.onopen = () => {
            console.log("Connected to websocket server");
            setWsConnected(true);
        };

        ws.current.onerror = (e: any) => {
            console.log("WebSocket error:", e.message);
        };

        ws.current.onclose = (e: any) => {
            console.log("WebSocket closed:", e.code, e.reason);
            setWsConnected(false);
            // Attempt to reconnect after a delay
            setTimeout(() => {
                initializeWebSocket();
            }, 5000);
        };
    };

    useEffect(() => {
        initializeWebSocket();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const fetchPlaces = async (input: string) => {
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

    const fetchTravelTime = async (origin: any, destination: any) => {
        const modes = ["car", "scooter"];
        let travelTime = {
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
                    travelTime[mode] = route.sections[0].summary.duration;
                }
            } catch (error: any) {
                console.error(`Error fetching ${mode} travel time:`, error.message);
            }
        }

        setTravelTime(travelTime);
        console.log("Travel time:", travelTime);
    };

    const fetchRoute = async (origin: any, destination: any) => {
        setIsLoading(true);

        const from_lat = origin.latitude;
        const from_long = origin.longitude;
        const to_lat = destination.latitude;
        const to_long = destination.longitude;

        try {
            const params = {
                transportMode: 'car',
                origin: `${from_lat},${from_long}`,
                destination: `${to_lat},${to_long}`,
                return: 'polyline,travelSummary',
                apiKey: process.env.EXPO_PUBLIC_HERE_API_KEY,
            };

            const response = await axios.get(
                'https://router.hereapi.com/v8/routes',
                { params }
            );

            console.log('Response data:', response);

            if (response.data.routes && response.data.routes.length > 0) {
                const polyline = response.data.routes[0].sections[0].polyline;

                if (polyline) {
                    const coordinates = decode(polyline);
                    setRouteCoordinates(coordinates);
                } else {
                    console.error('Polyline data is missing or incorrect');
                }

                const routeSummary = response.data.routes[0].sections[0].travelSummary;
                setRouteSummary(routeSummary);
                console.log('Route summary:', routeSummary);

                const length = routeSummary.length;
                const duration = routeSummary.duration;
                console.log('Route length:', length);
                console.log('Route duration:', duration);

                let distanceObject = {};
                distanceObject = { length: length};

                setDistance(distanceObject);
            } else {
                console.error('No route data found in the response');
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getEstimatedArrivalTime = (travelTime: any) => {
        const now = moment();
        const arrivalTime = now.add(travelTime, "seconds");
        console.log(travelTime, arrivalTime);
        return arrivalTime.format("hh:mm A");
    };

    const getNearbyDrivers = () => {
        ws.current.onmessage = async (e: any) => {
            try {
                const message = JSON.parse(e.data);
                if (message.type === "nearbyDrivers") {
                    await getDriversData(message.drivers);
                }
            } catch (error) {
                console.log(error, "Error parsing websocket");
            }
        };
    };

    const getDriversData = async (drivers: any) => {
        // Extract driver IDs from the drivers array
        const driverIds = drivers.map((driver: any) => driver.id).join(",");
        console.log("Driver IDs:", driverIds);
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_SERVER_URI}/driver/get-drivers-data`,
            {
                params: { ids: driverIds },
            }
        );

        const driverData = response.data;
        setDriverLists(driverData);
        setDriverLoader(false);
    };

    const requestNearbyDrivers = () => {
        console.log(wsConnected);
        if (currentLocation && wsConnected) {
            ws.current.send(
                JSON.stringify({
                    type: "requestRide",
                    role: "user",
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                })
            );
            getNearbyDrivers();
        }
    };

    const handleOrder = async () => {
        const data = {
            driver: selectedDriver || driverLists[0],
            user,
            currentLocation,
        };
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
            requestNearbyDrivers();
            setLocationSelected(true);
            setKeyboardAvoidingHeight(false);

            if (currentLocation) {
                await fetchTravelTime(currentLocation, selectedDestination);
                await fetchRoute(currentLocation, selectedDestination);
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
                </View>
            </View>
            <View style={styles.contentContainer}>
                <View style={[styles.container]}>
                    {
                        locationSelected ? (
                                <>
                                    {driverLoader ? (
                                        <View
                                            style={{
                                                flex: 1,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                height: 400,
                                            }}
                                        >
                                            <ActivityIndicator size={"large"} />
                                        </View>
                                    ) : (
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
                                                {
                                                    driverLists?.map((driver: DriverType) => (
                                                        <Pressable
                                                            style={{
                                                                width: windowWidth(420),
                                                                borderWidth:
                                                                    selectedVehicle === driver.vehicle_type ? 2 : 0,
                                                                borderRadius: 10,
                                                                padding: 10,
                                                                marginVertical: 5,
                                                            }}
                                                            onPress={() => {
                                                                setSelectedVehicle(driver.vehicle_type);
                                                            }}
                                                        >
                                                            <View style={{ margin: "auto" }}>
                                                                <Image
                                                                    source={
                                                                        driver?.vehicle_type === "Car"
                                                                            ? require("@/assets/images/vehicles/car.png")
                                                                            : driver?.vehicle_type === "Motorcycle"
                                                                                ? require("@/assets/images/vehicles/bike.png")
                                                                                : require("@/assets/images/vehicles/bike.png")
                                                                    }
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
                                                                        Swyft {driver?.vehicle_type}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 16 }}>
                                                                        {getEstimatedArrivalTime(travelTime.car)}{" "}
                                                                        drop off
                                                                    </Text>
                                                                </View>
                                                                <Text
                                                                    style={{
                                                                        fontSize: windowWidth(20),
                                                                        fontWeight: "600",
                                                                    }}
                                                                >
                                                                    VND{" "}
                                                                    {(
                                                                        distance ? (distance.length / 1000) * 9000 : 0
                                                                    ).toFixed(2)}
                                                                </Text>
                                                            </View>
                                                        </Pressable>
                                                    ))
                                                }

                                                <View
                                                    style={{
                                                        paddingHorizontal: windowWidth(10),
                                                        marginTop: windowHeight(15),
                                                    }}
                                                >
                                                    <Button
                                                        backgroundColor={"#000"}
                                                        textColor="#fff"
                                                        title={`Confirm Booking`}
                                                        onPress={() => handleOrder()}
                                                    />
                                                </View>
                                            </View>
                                        </ScrollView>
                                    )}
                                </>
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
                                            <Text style={{ padding: 5, fontSize: 16 }}>
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