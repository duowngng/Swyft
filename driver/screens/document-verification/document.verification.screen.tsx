import { View, Text, ScrollView } from "react-native";
import React, { useState } from "react";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import ProgressBar from "@/components/common/progress.bar";
import styles from "../signup/styles";
import { useTheme } from "@react-navigation/native";
import TitleView from "@/components/signup/title.view";
import Input from "@/components/common/input";
import SelectInput from "@/components/common/select-input";
import Button from "@/components/common/button";
import color from "@/themes/app.colors";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Toast } from "react-native-toast-notifications";

export default function DocumentVerificationScreen() {
    const driverData = useLocalSearchParams();
    const { colors } = useTheme();
    const [showWarning, setShowWarning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vehicleType: "Car",
        registrationNumber: "",
        registrationDate: "",
        drivingLicenseNumber: "",
        color: "",
    });

    const handleChange = (key: string, value: string) => {
        setFormData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const driver = {
            ...driverData,
            vehicle_type: formData.vehicleType,
            registration_number: formData.registrationNumber,
            registration_date: formData.registrationDate,
            driving_license: formData.drivingLicenseNumber,
            vehicle_color: formData.color,
        };

        await axios
            .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/driver/send-otp`, {
                phoneNumber: `${driverData.phoneNumber}`,
            })
            .then((res) => {
                router.push({
                    pathname: "/(routes)/verification-phone-number",
                    params: driver,
                });
                setLoading(false);
            })
            .catch(function (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
                console.log(error.config);
                setLoading(false);
                Toast.show(error.message, {
                    placement: "bottom",
                    type: "danger",
                });
            });
    };

    return (
        <ScrollView>
            <View>
                {/* logo */}
                <Text
                    style={{
                        fontFamily: "TT-Octosquares-Medium",
                        fontSize: windowHeight(22),
                        paddingTop: windowHeight(50),
                        textAlign: "center",
                    }}
                >
                    Swyft
                </Text>
                <View style={{ padding: windowWidth(20) }}>
                    <ProgressBar fill={2} />
                    <View
                        style={[styles.subView, { backgroundColor: colors.background }]}
                    >
                        <View style={styles.space}>
                            <TitleView
                                title={"Vehicle Registration"}
                                subTitle={"Explore your life by joining Swyft"}
                            />
                            <SelectInput
                                title="Vehicle Type"
                                placeholder="Choose your vehicle type"
                                value={formData.vehicleType}
                                onValueChange={(text) => handleChange("vehicleType", text)}
                                showWarning={showWarning && formData.vehicleType === ""}
                                warning={"Please choose your vehicle type!"}
                                items={[
                                    { label: "Car", value: "Car" },
                                    { label: "Motorcycle", value: "Motorcycle" },
                                ]}
                            />
                            <Input
                                title="Registration Number"
                                placeholder="Enter your vehicle registration number"
                                keyboardType="number-pad"
                                value={formData.registrationNumber}
                                onChangeText={(text) =>
                                    handleChange("registrationNumber", text)
                                }
                                showWarning={showWarning && formData.registrationNumber === ""}
                                warning={"Please enter your vehicle registration number!"}
                            />
                            <Input
                                title="Vehicle Registration Date"
                                placeholder="Enter your vehicle registration date"
                                value={formData.registrationDate}
                                onChangeText={(text) => handleChange("registrationDate", text)}
                                showWarning={showWarning && formData.registrationDate === ""}
                                warning={"Please enter your vehicle Registration Date number!"}
                            />
                            <Input
                                title={"Driving License Number"}
                                placeholder={"Enter your driving license number"}
                                keyboardType="number-pad"
                                value={formData.drivingLicenseNumber}
                                onChangeText={(text) =>
                                    handleChange("drivingLicenseNumber", text)
                                }
                                showWarning={
                                    showWarning && formData.drivingLicenseNumber === ""
                                }
                                warning={"Please enter your driving license number!"}
                            />
                            <Input
                                title={"Vehicle Color"}
                                placeholder={"Enter your vehicle color"}
                                value={formData.color}
                                onChangeText={(text) => handleChange("color", text)}
                                showWarning={showWarning && formData.color === ""}
                                warning={"Please enter your vehicle color!"}
                            />
                        </View>
                        <View style={styles.margin}>
                            <Button
                                onPress={() => handleSubmit()}
                                title={"Submit"}
                                height={windowHeight(30)}
                                backgroundColor={color.buttonBg}
                                textColor={color.whiteColor}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}