import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
    IS_LOGGED_IN,
    USER_FULL_DATA,
    SPD_USER_NAME,
} from "../config/config";
import { Colors } from "../config/colors";
import {
    setEncryptedID,
    getDecryptedID,
} from "../suggestus_plugin/util/util_functions";
import { callSuggestusAPI, setPatientId } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import confettiParticles from "../json_dummy_datas/confettiParticles";

const formatEmiratesId = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = "";
    if (cleaned.length > 0) {
        formatted += cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
        formatted += "-" + cleaned.substring(3, 7);
    }
    if (cleaned.length > 7) {
        formatted += "-" + cleaned.substring(7, 14);
    }
    if (cleaned.length > 14) {
        formatted += "-" + cleaned.substring(14, 15);
    }
    return formatted;
};

const formatPassport = (text: string) => {
    return text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

export default function RegisterNewPatient() {
    const router = useRouter();
    const route = useRoute();
    const [emiratesId, setEmiratesId] = useState("");
    const [passportNo, setPassportNo] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dob, setDob] = useState<Date>(new Date(2020, 7, 10)); // Aug 10, 1978
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<"Male" | "Female" | "">("Male");
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState("");



    const handleContinue = async () => {
        if (!emiratesId.trim() && !passportNo.trim()) {
            Toast.show({
                type: "error",
                text1: "Required Field",
                text2: "Please enter either your Emirates ID or Passport number.",
            });
            return;
        }
        if (!firstName.trim()) {
            Toast.show({
                type: "error",
                text1: "Required Field",
                text2: "Please enter your First name to continue.",
            });
            return;
        }
        if (!lastName.trim()) {
            Toast.show({
                type: "error",
                text1: "Required Field",
                text2: "Please enter your Last name to continue.",
            });
            return;
        }
        if (!gender) {
            Toast.show({
                type: "error",
                text1: "Required Field",
                text2: "Please select your gender.",
            });
            return;
        }

        setLoading(true);
        try {

            // 3. Statically set patient ID to 345
            await setPatientId("345");

            // 4. Mark the user as logged in
            await AsyncStorage.setItem(IS_LOGGED_IN, "true");

            Toast.show({
                type: "success",
                text1: "Profile Updated Successfully",
                text2: "Welcome to Emirates Hospitals Group",
            });



            router.replace("/init_screens/success");

        } catch (error) {
            console.error("Error saving personal details:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Something went wrong while saving your details. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const { height: screenHeight } = Dimensions.get("window");
    const isSmallScreen = screenHeight < 680;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.content, { paddingTop: isSmallScreen ? 20 : 40 }]}>

                        {/* Subheading instruction text */}
                        <Text style={styles.subtext}>
                            Enter your details for a personalized healthcare experience.
                        </Text>

                        {/* Unified Emirates ID / Passport Card */}
                        <View style={styles.unifiedCard}>
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: "#7D8A9D" }]}>Emirates ID</Text>
                                <View
                                    style={[
                                        styles.cardInputWrapper,
                                        focusedField === "emiratesId" && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.input, styles.inputNoOutline]}
                                        placeholder="123-0000-5505123-1"
                                        placeholderTextColor="#B3B7C6"
                                        value={emiratesId}
                                        onChangeText={(text) => setEmiratesId(formatEmiratesId(text))}
                                        onFocus={() => setFocusedField("emiratesId")}
                                        onBlur={() => setFocusedField("")}
                                        keyboardType="numeric"
                                        maxLength={18}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.orDividerRow}>
                                <View style={styles.dottedLine} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.dottedLine} />
                            </View>

                            <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                                <Text style={[styles.inputLabel, { color: "#7D8A9D" }]}>Passport no.</Text>
                                <View
                                    style={[
                                        styles.cardInputWrapper,
                                        focusedField === "passportNo" && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.input, styles.inputNoOutline]}
                                        placeholder="K5012250"
                                        placeholderTextColor="#B3B7C6"
                                        value={passportNo}
                                        onChangeText={(text) => setPassportNo(formatPassport(text))}
                                        onFocus={() => setFocusedField("passportNo")}
                                        onBlur={() => setFocusedField("")}
                                        autoCapitalize="characters"
                                        maxLength={12}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* First Name & Last Name row */}
                        <View style={styles.rowContainer}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>First name</Text>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        focusedField === "firstName" && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={focusedField === "firstName" ? Colors.secondary : Colors.label}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.inputNoOutline]}
                                        placeholder="John"
                                        placeholderTextColor="#B3B7C6"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        onFocus={() => setFocusedField("firstName")}
                                        onBlur={() => setFocusedField("")}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.inputLabel}>Last name</Text>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        focusedField === "lastName" && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={focusedField === "lastName" ? Colors.secondary : Colors.label}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.inputNoOutline]}
                                        placeholder="Doe"
                                        placeholderTextColor="#B3B7C6"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        onFocus={() => setFocusedField("lastName")}
                                        onBlur={() => setFocusedField("")}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Date of birth */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date of birth</Text>
                            {Platform.OS === "web" ? (
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        focusedField === "dob" && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={20}
                                        color={focusedField === "dob" ? Colors.secondary : Colors.label}
                                        style={styles.inputIcon}
                                    />
                                    <input
                                        type="date"
                                        value={dayjs(dob).format("YYYY-MM-DD")}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setDob(new Date(e.target.value));
                                            }
                                        }}
                                        onFocus={() => setFocusedField("dob")}
                                        onBlur={() => setFocusedField("")}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            outline: "none",
                                            fontSize: "16px",
                                            fontFamily: "QuicksandMedium",
                                            color: "#1B2130",
                                            backgroundColor: "transparent",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.inputWrapper,
                                        showDatePicker && styles.inputWrapperFocused,
                                    ]}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={20}
                                        color={showDatePicker ? Colors.secondary : Colors.label}
                                        style={styles.inputIcon}
                                    />
                                    <Text style={styles.input}>
                                        {dayjs(dob).format("MMM DD, YYYY")}
                                    </Text>
                                    <Text style={styles.changeLinkText}>Change</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Gender Select */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.rowContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderBox,
                                        gender === "Male" && styles.genderBoxActive,
                                        { marginRight: 8 },
                                    ]}
                                    onPress={() => setGender("Male")}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.radioContainer}>
                                        <View
                                            style={[
                                                styles.radioOuter,
                                                gender === "Male" && styles.radioOuterActive,
                                            ]}
                                        >
                                            {gender === "Male" && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={styles.genderText}>Male</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.genderBox,
                                        gender === "Female" && styles.genderBoxActive,
                                        { marginLeft: 8 },
                                    ]}
                                    onPress={() => setGender("Female")}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.radioContainer}>
                                        <View
                                            style={[
                                                styles.radioOuter,
                                                gender === "Female" && styles.radioOuterActive,
                                            ]}
                                        >
                                            {gender === "Female" && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={styles.genderText}>Female</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </ScrollView>

                <View style={[styles.bottomBtnContainer, { paddingBottom: Platform.OS === "ios" ? (isSmallScreen ? 16 : 36) : 24 }]}>
                    <TouchableOpacity
                        style={[
                            styles.continueBtn,
                            styles.continueBtnEnabled,
                        ]}
                        disabled={loading}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.background} />
                        ) : (
                            <Text style={styles.continueBtnText}>Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={dob}
                maximumDate={new Date()}
                onConfirm={(date) => {
                    setDob(date);
                    setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
            />
            <Toast />

        </View>
    );
}

const styles: any = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    unifiedCard: {
        backgroundColor: "#EBF3FC",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        width: "100%",
    },
    cardInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        width: "100%",
    },
    orDividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
        width: "100%",
    },
    dottedLine: {
        flex: 1,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#A9BCCF",
        height: 1,
    },
    orText: {
        fontSize: 12,
        fontFamily: "QuicksandBold",
        color: "#7D8A9D",
        marginHorizontal: 12,
    },
    subtext: {
        fontSize: 14,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        marginBottom: 24,
        lineHeight: 20,
        textAlign: "left",
    },
    inputContainer: {
        width: "100%",
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: "QuicksandSemiBold",
        color: Colors.label,
        marginBottom: 8,
        textAlign: "left",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.lightgray,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        width: "100%",
    },
    inputWrapperFocused: {
        borderColor: Colors.secondary,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#1B2130",
        fontFamily: "QuicksandMedium",
        paddingVertical: 0,
    },
    // @ts-ignore: outlineStyle is web-only
    inputNoOutline: {
        outlineStyle: "none",
        outlineWidth: 0,
    } as any,
    rowContainer: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
    },
    datePickerTrigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.lightgray,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        width: "100%",
    },
    datePickerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    datePickerText: {
        fontSize: 16,
        color: "#1B2130",
        fontFamily: "QuicksandMedium",
    },

    changeLinkText: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.secondary,
    },
    genderBox: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.lightgray,
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    genderBoxActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.background,
    },
    radioContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#B3B7C6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    radioOuterActive: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    genderText: {
        fontSize: 16,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    bottomBtnContainer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === "ios" ? 36 : 24,
        paddingTop: 12,
        backgroundColor: Colors.background,
    },
    continueBtn: {
        width: "100%",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    continueBtnEnabled: {
        backgroundColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    continueBtnText: {
        color: Colors.lightgray,
        fontSize: 16,
        fontFamily: "QuicksandSemiBold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 28,
        alignItems: "center",
        justifyContent: "center",
        width: "90%",
        height: "65%",
        maxWidth: 340,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    illustrationContainer: {
        width: 280,
        height: 280,
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#0076D6",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#0076D6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    confetti: {
        position: "absolute",
        borderRadius: 2,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: "QuicksandBold",
        color: "#1B2130",
        marginBottom: 12,
        textAlign: "center",
    },
    modalSubtext: {
        fontSize: 14,
        fontFamily: "QuicksandMedium",
        color: "#7D8A9D",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 10,
    },
});