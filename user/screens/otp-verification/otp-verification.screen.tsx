import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import SignInText from "@/components/login/signin.text";
import OTPTextInput from "react-native-otp-textinput";
import { styles } from "./styles";
import color from "@/themes/app.colors";
import { external } from "@/styles/external.style";
import Button from "@/components/common/button";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "@/styles/common.style";
import { useToast } from "react-native-toast-notifications";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function OtpVerificationScreen() {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { number }  = useLocalSearchParams();


    const handleSubmit = async () => {
        if (otp === "") {
            toast.show("Please fill the fields!", {
                placement: "bottom",
            });
        } else {
            setLoading(true);
            const otpNumber = `${otp}`;
            await axios
                .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/verify-otp`, {
                    phoneNumber: number,
                    otp: otpNumber,
                })
                .then(async (res) => {
                    console.log(res);
                    setLoading(false);
                    if (res.data.user.email === null) {
                        router.push({
                            pathname: "/(routes)/registration",
                            params: { user: JSON.stringify(res.data.user) },
                        });
                        toast.show("Account verified!");
                    } else {
                        await AsyncStorage.setItem("accessToken", res.data.accessToken);
                        router.push("/(tabs)/home");
                    }
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
                    toast.show("Something went wrong! Please check your OTP!", {
                        type: "danger",
                        placement: "bottom",
                    });
                });
                // .catch((error) => {
                //     setLoading(false);
                //     console.log(error);
                //     toast.show("Something went wrong! Please check your OTP!", {
                //         type: "danger",
                //         placement: "bottom",
                //     });
                // });
        }
    };

    return (
        <AuthContainer
            topSpace={windowHeight(240)}
            imageShow={true}
            container={
                <View>
                    <SignInText
                        title={"OTP Verification"}
                        subtitle={"Check your phone number for the OTP!"}
                    />
                    <OTPTextInput
                        handleTextChange={(code) => setOtp(code)}
                        inputCount={4}
                        textInputStyle={styles.otpTextInput}
                        tintColor={color.subtitle}
                        autoFocus={false}
                    />
                    <View style={[external.mt_30]}>
                        <Button
                            title="Verify"
                            onPress={() => handleSubmit()}
                            disabled={loading}
                        />
                    </View>
                    <View style={[external.mb_15]}>
                        <View
                            style={[
                                external.pt_10,
                                external.Pb_10,
                                { flexDirection: "row", gap: 5, justifyContent: "center" },
                            ]}
                        >
                            <Text style={[commonStyles.regularText]}>Not Received yet?</Text>
                            <TouchableOpacity>
                                <Text style={[styles.signUpText, { color: "#000" }]}>
                                    Resend it
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
        />
    );
}
