import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
import { SvgIonicons } from "../components/icons/SvgIcons";
import CustomHeader from "../components/CustomHeader";
import { getDecryptedID } from "../suggestus_plugin/util/util_functions";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";

const { width } = Dimensions.get("window");

// Matches the literal AsyncStorage key written by fetchAndApplyOrgConfig()
// in app/services/orgConfig.ts (setEncryptedID("TERM_CONDITION", ...)).
const TERM_CONDITION_KEY = "TERM_CONDITION";

// react-native-render-html doesn't reliably honor embedded <style> tags —
// the backend HTML leads with one targeting a .termsConditionPopup class.
// Strip it so it doesn't render as visible raw CSS text.
const stripLeadingStyleBlock = (html: string): string =>
  html.replace(/<style[\s\S]*?<\/style>/i, "").trim();

const DEFAULT_NEXT_ROUTE = "/(drawer)/tab_bar_home/HomeScreen";

export default function TermsAndPrivacyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ user_id?: string; next?: string }>();
  const user_id = params?.user_id;
  const next = params?.next || DEFAULT_NEXT_ROUTE;

  const [loadingHtml, setLoadingHtml] = useState(true);
  const [termsHtml, setTermsHtml] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTerms = async () => {
      const raw = await getDecryptedID(TERM_CONDITION_KEY);
      setTermsHtml(stripLeadingStyleBlock(raw || ""));
      setLoadingHtml(false);
    };
    loadTerms();
  }, []);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // sgUserId / sgOrgId / sgRoleId are "userdata" — auto-injected by
      // callSuggestusAPI from the stored session, not passed here.
      await callSuggestusAPI(
        spd_processId_config.sgconf_save_mst_user_attribute_mapping,
        {
          p_id: "",
          p_attribute_code: "USER_ATTRIBUTES",
          p_attribute_value: JSON.stringify({ user_eula_agreement: "Y" }),
          p_attribute_reference_id: user_id ?? "",
          p_attribute_reference_code: "USER_ID",
          p_active_status: "Y",
          p_internal_flag: "N",
        },
      );
    } catch (e) {
      // Best-effort — never block onboarding on a consent-log failure.
      console.error("Error saving EULA agreement:", e);
    } finally {
      setSaving(false);
    }

    router.replace(next as any);
  };

  const hasContent = termsHtml.trim().length > 0;

  return (
    <View style={styles.container}>
      <CustomHeader title="Terms & Privacy" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingHtml ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : hasContent ? (
          <RenderHtml
            contentWidth={width - 48}
            source={{ html: termsHtml }}
            tagsStyles={htmlStyles}
            baseStyle={htmlBaseStyle}
            systemFonts={SYSTEM_FONTS}
            enableExperimentalMarginCollapsing
          />
        ) : (
          <Text style={styles.fallbackText}>
            Terms & Conditions and Privacy Policy are currently unavailable. By
            continuing, you agree to our standard terms of service.
          </Text>
        )}

        <View style={styles.consentSection}>
          <TouchableOpacity
            style={styles.consentRow}
            activeOpacity={0.7}
            onPress={() => setAgreed(!agreed)}
          >
            <View
              style={[styles.checkboxBase, agreed && styles.checkboxChecked]}
            >
              {agreed && (
                <SvgIonicons name="checkmark" size={16} color={Colors.lightgray} />
              )}
            </View>
            <Text style={styles.consentText}>
              I have read and agree to the Terms & Conditions and Privacy
              Policy. I consent to the collection, processing, and sharing of my
              information for the purpose of providing healthcare services.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBtnContainer}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            agreed ? styles.continueBtnEnabled : styles.continueBtnDisabled,
          ]}
          disabled={!agreed || saving}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={Colors.lightgray} />
          ) : (
            <Text style={styles.continueBtnText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Quicksand ships each weight as a separate font file, so a bold tag must
// select the bold *file* AND set fontWeight/fontStyle to "normal" — otherwise
// react-native-render-html layers its own fontWeight:"bold" on top, producing
// synthetic double-bolding (the heavy, slightly blurred text in the CMS terms).
const SYSTEM_FONTS = [
  FontFamilies.bold,
  FontFamilies.semiBold,
  FontFamilies.medium,
  FontFamilies.regular,
  FontFamilies.light,
];

const htmlBaseStyle = {
  fontFamily: FontFamilies.regular,
  color: Colors.text,
  fontSize: 14,
  lineHeight: 21,
  fontWeight: "normal" as const,
};

const bold = {
  fontFamily: FontFamilies.semiBold,
  fontWeight: "normal" as const,
  color: Colors.text,
};

const heading = (fontSize: number, marginTop: number, marginBottom: number) => ({
  fontSize,
  fontFamily: FontFamilies.bold,
  fontWeight: "normal" as const,
  color: Colors.text,
  marginTop,
  marginBottom,
});

const body = {
  fontSize: 14,
  fontFamily: FontFamilies.regular,
  fontWeight: "normal" as const,
  color: Colors.text,
  lineHeight: 21,
};

const htmlStyles = {
  h1: heading(20, 8, 12),
  h2: heading(18, 16, 10),
  h3: { ...heading(16, 12, 8), fontFamily: FontFamilies.semiBold },
  h4: { ...heading(15, 10, 6), fontFamily: FontFamilies.semiBold },
  h5: { ...heading(14, 8, 6), fontFamily: FontFamilies.semiBold },
  h6: { ...heading(14, 8, 6), fontFamily: FontFamilies.semiBold },
  p: { ...body, marginTop: 0, marginBottom: 10 },
  div: { ...body },
  span: { ...body },
  li: { ...body, marginBottom: 6 },
  // Consistent indentation for both list types + nested lists; RenderHtml uses
  // the li text style for the marker, so markers inherit the theme font/color.
  ul: { marginTop: 0, marginBottom: 10, paddingLeft: 18 },
  ol: { marginTop: 0, marginBottom: 10, paddingLeft: 18 },
  strong: bold,
  b: bold,
  em: { ...body, fontStyle: "italic" as const },
  i: { ...body, fontStyle: "italic" as const },
  u: { ...body, textDecorationLine: "underline" as const },
  a: { ...body, color: Colors.secondary, textDecorationLine: "underline" as const },
  br: { height: 8 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  fallbackText: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.textLabel,
    lineHeight: 20,
    marginTop: 24,
  },
  bottomBtnContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
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
      android: { elevation: 4 },
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
  consentSection: { marginTop: 24, paddingBottom: 8 },
  consentRow: { flexDirection: "row", alignItems: "flex-start" },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 10,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  },
});
