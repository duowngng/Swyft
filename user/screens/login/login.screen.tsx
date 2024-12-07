import { View, Text, Image } from "react-native";
import React, { useState } from "react";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import styles from "./styles";
import Images from "@/utils/images";
import SignInText from "@/components/login/signin.text";
import { external } from "@/styles/external.style";
import PhoneNumberInput from "@/components/login/phone-number.input";
import Button from "@/components/common/button";
import { router } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import axios from "axios";

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [countryCode, setCountryCode] = useState("+84");
    const toast = useToast();

    const handleSubmit = async () => {
        if (phoneNumber === "" || countryCode === "") {
            toast.show("Please fill the fields!", {
                placement: "bottom",
            });
        } else {
            setLoading(true);
            const number = `${countryCode}${phoneNumber}`;
            await axios
                .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/registration`, {
                    phoneNumber: number,
                })
                .then((res) => {
                    setLoading(false);
                    router.push({
                        pathname: "/(routes)/otp-verification",
                        params: { number },
                    });
                })
                .catch((error) => {
                    setLoading(false);
                    console.log(error);
                    toast.show(
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
                                        onPress={() => handleSubmit()}
                                        disabled={loading}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            }
        />
    );
}