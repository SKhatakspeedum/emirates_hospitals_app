import React, { useState, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../config/colors";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import CountryFlag from "react-native-country-flag";

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import countries, { countryCodeAliasMap } from "../json_dummy_datas/country";
import { FontFamilies } from "../config/fonts";
import { SPD_COUNTRY_CODES_FOR_PHONE } from "../config/config";
import { getDecryptedID } from "../suggestus_plugin/util/util_functions";
import { useOrgLogo } from "../hooks/useOrgLogo";

export default function LoginScreen() {
  const router = useRouter();
  const logoSource = useOrgLogo();
  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 680;

  // Dynamic country picker states
  const [availableCountries, setAvailableCountries] = useState(countries);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Check if phone number length matches the selected country's placeholder length
  const expectedLength = selectedCountry.placeholder.replace(/[^0-9]/g, "").length;
  const isLengthMatching = phoneDigits.length === expectedLength;
  const maskedPlaceholder = selectedCountry.placeholder.replace(/[0-9]/g, "X");

  // Clear query on modal toggle
  useEffect(() => {
    if (!showCountryModal) {
      setSearchQuery("");
    }
  }, [showCountryModal]);

  // Restrict the country list to spd_country_codes_for_phone (from the org
  // config fetched in _layout.tsx), falling back to the full list when that
  // config is missing, empty, or doesn't match any known country.
  useEffect(() => {
    const loadAllowedCountries = async () => {
      try {
        const raw = await getDecryptedID(SPD_COUNTRY_CODES_FOR_PHONE);
        if (!raw) return;

        const codes = JSON.parse(raw);
        if (!Array.isArray(codes) || codes.length === 0) return;

        const allowedFlags = codes
          .map((c: string) =>
            (countryCodeAliasMap as Record<string, string>)[
              String(c).toUpperCase()
            ] ?? String(c).toLowerCase(),
          )
          .filter(Boolean);

        const filtered = countries.filter((c) =>
          allowedFlags.includes(c.flag),
        );

        if (filtered.length > 0) {
          setAvailableCountries(filtered);
          setSelectedCountry((prev) =>
            filtered.some((c) => c.code === prev.code) ? prev : filtered[0],
          );
        }
      } catch (_) {
        // Keep the default full country list on any error
      }
    };
    loadAllowedCountries();
  }, []);

  // Truncate phone digits if they exceed the selected country's maximum length
  useEffect(() => {
    const maxLen = selectedCountry.placeholder.replace(/[^0-9]/g, "").length;
    if (phoneDigits.length > maxLen) {
      setPhoneDigits(phoneDigits.slice(0, maxLen));
    }
  }, [selectedCountry]);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    setPhoneDigits(digits);
  };

  const handlePhoneContinue = async () => {
    if (!isLengthMatching) {
      Toast.show({
        type: "error",
        text1: "Invalid Number",
        text2: `Phone number must be ${expectedLength} digits.`,
      });
      return;
    }

    setPhoneLoading(true);
    const fullPhoneNumber = `${selectedCountry.code} ${phoneDigits}`;

    try {
      const res = await callSuggestusAPI(
        spd_processId_config.sgconf_save_mst_user_otp_for_sms,
        {
          p_email_id: "",
          p_usr_phone_number: fullPhoneNumber,
          p_additional_attributes: {
            p_name: "",
            p_usr_additional_attributes: JSON.stringify({
              p_first_name: "",
              p_last_name: "",
            }),
            p_ai_code: SiteConfig.AI_CODE,
            p_domian_url: SiteConfig.ACTION_URL,
          },
        },
      );

      setPhoneLoading(false);

      if (res?.returnCode === true) {
        const returnedOtp = res?.returnData?.[0]?.otp ?? "";
        Toast.show({
          type: "success",
          text1: "Verification Code Sent",
          text2: "A code has been sent to your phone.",
        });
        router.replace({
          pathname: "./otp_verification",
          params: { check_otp: returnedOtp, phone_number: fullPhoneNumber },
        });
      }
    } catch (e) {
      setPhoneLoading(false);
    }
  };

  const filteredCountries = availableCountries.filter(
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
      <CountryFlag isoCode={item.flag.toLowerCase()} size={18} />
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
                source={logoSource}
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
                  <CountryFlag isoCode={selectedCountry.flag.toLowerCase()} size={18} />
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.label} style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.separator} />

                <Text style={styles.countryCodePrefix}>{selectedCountry.code}</Text>

                <TextInput
                  style={styles.phoneTextInput}
                  keyboardType="phone-pad"
                  value={phoneDigits}
                  onChangeText={handlePhoneChange}
                  placeholder={maskedPlaceholder}
                  placeholderTextColor={Colors.inactive}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmitEditing={handlePhoneContinue}
                  returnKeyType="done"
                  maxLength={expectedLength}
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
              isLengthMatching ? styles.continueBtnEnabled : styles.continueBtnDisabled,
            ]}
            disabled={phoneLoading || !isLengthMatching}
            onPress={handlePhoneContinue}
            activeOpacity={0.8}
          >
            {phoneLoading ? (
              <ActivityIndicator color={Colors.lightgray} />
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
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={styles.modalContent}>
            {/* Sheet grab handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)} activeOpacity={0.6}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Premium Search Bar */}
            <View style={[
              styles.searchBarContainer,
              isSearchFocused && styles.searchBarContainerFocused
            ]}>
              <MaterialIcons name="search" size={20} color={Colors.label} style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search country name or dialing code"
                placeholderTextColor={Colors.inactive}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
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
        </View>
      </Modal>
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
    fontSize: 22,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "left",
  },
  startSubtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.medium,
    color: Colors.label,
    marginBottom: 40,
    textAlign: "left",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.textLabel,
    marginBottom: 8,
  },
  phoneInputContainer: {
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
  phoneInputContainerFocused: {
    borderColor: Colors.secondary,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  selectedFlagEmoji: {
    fontSize: 21,
  },
  chevron: {
    marginLeft: 6,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  countryCodePrefix: {
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    color: Colors.text,
    marginRight: 8,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
    paddingVertical: 0,
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0,
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
  continueBtnDisabled: {
    backgroundColor: Colors.inactive,
  },
  continueBtnText: {
    color: Colors.lightgray,
    fontSize: 16,
    fontFamily: FontFamilies.bold,
  },

  // Premium Bottom-Sheet Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.border,
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
    fontFamily: FontFamilies.bold,
    color: Colors.text,
  },

  // Premium Search Bar Styling
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightgray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    height: 56,
  },
  searchBarContainerFocused: {
    borderColor: Colors.secondary,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    paddingVertical: 0,
    // @ts-ignore: outlineStyle is web-only
    outlineStyle: "none",
    outlineWidth: 0,
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
    borderBottomColor: Colors.border,
  },
  countryFlagEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.text,
    marginLeft: 8,
  },
  countryDialCode: {
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Colors.label,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FontFamilies.semiBold,
    color: Colors.label,
  },
});
