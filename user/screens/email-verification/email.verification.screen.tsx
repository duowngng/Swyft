import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import SignInText from "@/components/login/signin.text";
import { commonStyles } from "@/styles/common.style";
import { external } from "@/styles/external.style";
import Button from "@/components/common/button";
import { styles } from "../otp-verification/styles";
import color from "@/themes/app.colors";
import { Toast } from "react-native-toast-notifications";
import OTPTextInput from "react-native-otp-textinput";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EmailVerificationScreen() {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useLocalSearchParams() as any;
    const parsedUser = JSON.parse(user);

    const handleSubmit = async () => {
        setLoading(true);
        const otpNumber = `${otp}`;
        await axios
            .put(`${process.env.EXPO_PUBLIC_SERVER_URI}/email-otp-verify`, {
                token: parsedUser.token,
                otp: otpNumber,
            })
            .then(async (res: any) => {
                setLoading(false);
                await AsyncStorage.setItem("accessToken", res.data.accessToken);
                router.push("/(tabs)/home");
            })
            .catch((error) => {
                setLoading(false);
                Toast.show(error.message, {
                    placement: "bottom",
                    type: "danger",
                });
            });
    };

    return (
        <AuthContainer
            topSpace={windowHeight(240)}
            imageShow={true}
            container={
                <View>
                    <SignInText
                        title={"Email Verification"}
                        subtitle={"Check your email address for the otp!"}
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