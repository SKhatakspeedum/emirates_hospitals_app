import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { setEncryptedID } from "../suggestus_plugin/util/util_functions";
import {
  SPD_USER_ID,
  USER_FULL_DATA,
  IS_LOGGED_IN,
  SPD_USER_NAME,
  SPD_USER_EMAIL,
} from "../config/config";

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import countries from "../json_dummy_datas/country";

export default function LoginScreen() {
  const router = useRouter();

  // Dynamic country picker states
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Clear query on modal toggle
  useEffect(() => {
    if (!showCountryModal) {
      setSearchQuery("");
    }
  }, [showCountryModal]);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    setPhoneDigits(digits);
  };

  const isPhoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 12;

  const handlePhoneContinue = async () => {
    setPhoneLoading(true);
    const fullPhoneNumber = `${selectedCountry.code} ${phoneDigits}`;
    const mockOtp = "123456";
    setTimeout(async () => {
      setPhoneLoading(false);
      Toast.show({
        type: "success",
        text1: "Verification Code Sent",
        text2: `Your code is ${mockOtp}`,
      });
      await setEncryptedID(USER_FULL_DATA, JSON.stringify({
        fname: "Guest User",
        email: "guest@emirates.ae",
        contact: fullPhoneNumber,
      }));
      await setEncryptedID(SPD_USER_ID, "guest_user_id");
      await setEncryptedID(SPD_USER_NAME, "Guest User");
      await setEncryptedID(SPD_USER_EMAIL, "guest@emirates.ae");

      router.replace({
        pathname: "./otp_verification",
        params: { check_otp: mockOtp, phone_number: fullPhoneNumber },
      });
    }, 1500);
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery)
  );

  const renderCountryItem = ({ item }: { item: typeof countries[0] }) => (
    <TouchableOpacity
      style={styles.countryRow}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
      }}
      activeOpacity={0.6}
    >
      <Text style={styles.countryFlagEmoji}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDialCode}>{item.code}</Text>
    </TouchableOpacity>
  );

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
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.startTitle}>Let's get started</Text>
            <Text style={styles.startSubtitle}>To start, what is your mobile phone number?</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.phoneLabel}>Phone No.</Text>
              <View style={[styles.phoneInputContainer, isFocused && styles.phoneInputContainerFocused]}>
                <TouchableOpacity
                  style={styles.countryPicker}
                  onPress={() => setShowCountryModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectedFlagEmoji}>{selectedCountry.flag}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={16} color="#7E8494" style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.separator} />

                <Text style={styles.countryCodePrefix}>{selectedCountry.code}</Text>

                <TextInput
                  style={styles.phoneTextInput}
                  keyboardType="phone-pad"
                  value={phoneDigits}
                  onChangeText={handlePhoneChange}
                  placeholder={selectedCountry.placeholder}
                  placeholderTextColor="#B3B7C6"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              isPhoneValid ? styles.continueBtnEnabled : styles.continueBtnDisabled,
            ]}
            disabled={!isPhoneValid || phoneLoading}
            onPress={handlePhoneContinue}
            activeOpacity={0.8}
          >
            {phoneLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country Selector Bottom-Sheet Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.modalContent}>
            {/* Sheet grab handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)} activeOpacity={0.6}>
                <MaterialIcons name="close" size={24} color="#1A1D24" />
              </TouchableOpacity>
            </View>

            {/* Premium Search Bar */}
            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={20} color="#8E95A9" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search country name or dialing code"
                placeholderTextColor="#B3B7C6"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              contentContainerStyle={styles.listContainer}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No countries matched your search.</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  logoContainer: {

    alignItems: "center",
    marginVertical: 50,
    width: "100%",
  },
  logoImg: {
    width: '80%',
    maxWidth: 280,
    aspectRatio: 4,
    height: 70,
  },
  startTitle: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
    marginBottom: 8,
    textAlign: "left",
  },
  startSubtitle: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: "#6F768E",
    marginBottom: 40,
    textAlign: "left",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: "#8E95A9",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFF",
    borderWidth: 1,
    borderColor: "#F0F1F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
  },
  phoneInputContainerFocused: {
    borderColor: "#0177C8",
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  selectedFlagEmoji: {
    fontSize: 22,
  },
  chevron: {
    marginLeft: 6,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E5ED",
    marginHorizontal: 16,
  },
  countryCodePrefix: {
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#1B2130",
    marginRight: 8,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    color: "#1B2130",
    fontFamily: "QuicksandMedium",
    paddingVertical: 0,
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0,
  },
  bottomBtnContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  continueBtn: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueBtnEnabled: {
    backgroundColor: "#001871",
    ...Platform.select({
      ios: {
        shadowColor: "#001871",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueBtnDisabled: {
    backgroundColor: "#D0D4DF",
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },

  // Premium Bottom-Sheet Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E5ED",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "QuicksandBold",
    color: "#1A1D24",
  },

  // Premium Search Bar Styling
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FC",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: "#1B2130",
    paddingVertical: 0,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FC",
  },
  countryFlagEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "QuicksandMedium",
    color: "#1A1D24",
  },
  countryDialCode: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#6F768E",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: "#8E95A9",
  },
});
