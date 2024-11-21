import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import styles from "./styles";
import Images from "@/utils/images";
import SignInText from "@/components/login/signin.text";
import { external } from "@/styles/external.style";
import Button from "@/components/common/button";
import { router } from "expo-router";
import PhoneNumberInput from "@/components/login/phone-number.input";
import { Toast } from "react-native-toast-notifications";
import axios from "axios";

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [countryCode, setCountryCode] = useState("+84");

    const handleSubmit = async () => {
        if (phoneNumber === "" || countryCode === "") {
            Toast.show("Please fill the fields!", {
                placement: "bottom",
            });
        } else {
            setLoading(true);
            const number = `${countryCode}${phoneNumber}`;
            await axios
                .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/driver/send-otp`, {
                    phoneNumber: number,
                })
                .then((res) => {
                    setLoading(false);
                    const driver = {
                        phoneNumber: number,
                    };
                    router.push({
                        pathname: "/(routes)/verification-phone-number",
                        params: driver,
                    });
                })
                .catch((error) => {
                    console.log(error);
                    setLoading(false);
                    Toast.show(
                        "Something went wrong! Please check your phone number!",
                        {
                            type: "danger",
                            placement: "bottom",
                        }
                    );
                });
        }
    };

    return (
        <AuthContainer
            topSpace={windowHeight(150)}
            imageShow={true}
            container={
                <View>
                    <View>
                        <View>
                            <Image style={styles.transformLine} source={Images.line} />
                            <SignInText />
                            <View style={[external.mt_25, external.Pb_10]}>
                                <PhoneNumberInput
                                    phoneNumber={phoneNumber}
                                    setPhoneNumber={setPhoneNumber}
                                    countryCode={countryCode}
                                    setCountryCode={setCountryCode}
                                />
                                <View style={[external.mt_25, external.Pb_15]}>
                                    <Button
                                        title="Get OTP"
                                        disabled={loading}
                                        height={windowHeight(35)}
                                        onPress={() => handleSubmit()}
                                    />
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        gap: windowWidth(8),
                                        paddingBottom: windowHeight(15),
                                    }}
                                >
                                    <Text style={{ fontSize: windowHeight(12) }}>
                                        Don't have any rider account?
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(routes)/signup")}
                                    >
                                        <Text style={{ color: "blue", fontSize: windowHeight(12) }}>
                                            Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            }
        />
    );
}