import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { SvgIonicons } from "@/app/components/icons/SvgIcons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";

// Renders the order's real result document (order.docUrl, resolved in
// OrdersScreen.tsx from the backend's doc_path/download_doc_path/spdFilePath).
//
// react-native-webview has no web implementation in this project (the
// react-native-web-webview shim is installed but never aliased in
// metro.config.js), so <WebView> silently renders nothing on web — on
// Platform.OS === "web" we instead render a plain <iframe> (via
// React.createElement, since this file isn't a .web.tsx and JSX doesn't
// know the "iframe" intrinsic), which every modern browser renders PDFs
// into natively without any proxy. On native, WebView can't render a
// remote PDF directly (especially Android), so we point it at Google's
// Docs Viewer proxy instead. Falls back to a plain text summary of the
// order's own fields when there's no document yet or it fails to load.
export default function OrderResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order = route.params?.order || {};
  const [webViewError, setWebViewError] = useState(false);
  const [isDocLoading, setIsDocLoading] = useState(true);

  const docUrl: string = order.docUrl || "";
  const nativeViewerUrl = docUrl
    ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(docUrl)}`
    : "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <CustomHeader title={"Orders"} onBackPress={() => navigation.goBack()} />

      {docUrl && !webViewError ? (
        <View style={styles.viewerContainer}>
          {Platform.OS === "web" ? (
            <>
              {isDocLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading document...</Text>
                </View>
              )}
              {React.createElement("iframe", {
                src: docUrl,
                title: order.docName || "Result",
                style: {
                  flex: 1,
                  border: "none",
                  width: "100%",
                  height: "100%",
                  opacity: isDocLoading ? 0 : 1,
                  position: isDocLoading ? "absolute" : "relative",
                  top: 0,
                  left: 0,
                },
                onLoad: () => setIsDocLoading(false),
                onError: () => setWebViewError(true),
              })}
            </>
          ) : (
            <WebView
              source={{ uri: nativeViewerUrl }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading document...</Text>
                </View>
              )}
              onError={() => setWebViewError(true)}
              onHttpError={() => setWebViewError(true)}
            />
          )}
          {/* <TouchableOpacity
            style={styles.openExternalBtn}
            onPress={() => Linking.openURL(docUrl)}
            activeOpacity={0.8}
          >
            <SvgIonicons name="open-outline" size={16} color={Colors.background} />
            <Text style={styles.openExternalText}>Open in browser</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <View style={styles.summaryContainer}>
          <SvgIonicons 
            name={
              webViewError ? "alert-circle-outline" : "document-text-outline"
            }
            size={56}
            color={Colors.inactive}
          />
          <Text style={styles.summaryTitle}>
            {webViewError
              ? "Could not load the document"
              : "No document available yet"}
          </Text>
          {/* {webViewError && !!docUrl && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => Linking.openURL(docUrl)}
            >
              <Text style={styles.retryBtnText}>Open in browser instead</Text>
            </TouchableOpacity>
          )} */}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryRow}>
              <Text style={styles.boldText}>Order: </Text>
              {order.title || "-"}
            </Text>
            <Text style={styles.summaryRow}>
              <Text style={styles.boldText}>Doctor: </Text>
              {order.doctor || "-"}
            </Text>
            <Text style={styles.summaryRow}>
              <Text style={styles.boldText}>Date: </Text>
              {order.date || "-"}
            </Text>
            <Text style={styles.summaryRow}>
              <Text style={styles.boldText}>Status: </Text>
              {order.status || "-"}
            </Text>
            {!!order.findings && (
              <>
                <Text
                  style={[
                    styles.summaryRow,
                    styles.boldText,
                    styles.summarySectionTitle,
                  ]}
                >
                  Findings
                </Text>
                <Text style={styles.summaryRow}>{order.findings}</Text>
              </>
            )}
            {!!order.recommendations && (
              <>
                <Text
                  style={[
                    styles.summaryRow,
                    styles.boldText,
                    styles.summarySectionTitle,
                  ]}
                >
                  Recommendations
                </Text>
                <Text style={styles.summaryRow}>{order.recommendations}</Text>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  viewerContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
  },
  openExternalBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  openExternalText: {
    color: Colors.background,
    fontSize: 13,
    fontFamily: FontFamilies.semiBold,
  },
  summaryContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  summaryTitle: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamilies.bold,
    marginTop: 12,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 14,
    borderWidth: 1.2,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  summaryCard: {
    width: "100%",
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  summaryRow: {
    fontSize: 13.5,
    color: Colors.text,
    fontFamily: FontFamilies.regular,
    lineHeight: 20,
    marginBottom: 4,
  },
  summarySectionTitle: {
    marginTop: 10,
  },
  boldText: {
    fontFamily: FontFamilies.bold,
  },
});
