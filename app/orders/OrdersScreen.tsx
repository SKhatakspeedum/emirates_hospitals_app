import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  Pressable,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Fontisto, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import CustomTabs from "../components/CustomTabs";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";
import { SiteConfig } from "../config/site_config";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

type ButtonAction = "call" | "book" | "view_result" | "view_details";

const VALID_BUTTON_ACTIONS: ButtonAction[] = [
  "call",
  "book",
  "view_result",
  "view_details",
];

// Custom Type Definitions for Orders
interface OrderItem {
  id: string;
  title: string;
  status: string;
  doctor: string;
  date: string;
  department: string;
  bucket: "active" | "history";
  // The backend can send more than one action for a single order as a
  // "~"-delimited string (e.g. "call~book~view_result") — every valid
  // action in it gets its own button. An empty/unrecognized value yields
  // an empty array, i.e. no action buttons.
  buttonType: ButtonAction[];
  // Result details
  findings?: string;
  recommendations?: string;
  reason?: string;
  docUrl?: string;
  docName?: string;
}

const parseButtonTypes = (raw: string | undefined | null): ButtonAction[] => {
  if (!raw) return [];
  return raw
    .split("~")
    .map((s) => s.trim())
    .filter((s): s is ButtonAction =>
      VALID_BUTTON_ACTIONS.includes(s as ButtonAction),
    );
};

// Order doc paths (doc_path/download_doc_path/spdFilePath) come back as
// relative paths, e.g. "uploaded_files/documents/xyz.pdf" — resolve them
// against the backend host, tolerating an already-absolute URL.
const resolveDocUrl = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SiteConfig.DEV_URL}/${path.replace(/^\//, "")}`;
};

// The backend doesn't send a separate "is active"/"button type" flag, so we
// derive presentation (badge color, active-vs-history tab, and which action
// button to show) from keywords in the status text. This tolerates status
// text that doesn't exactly match the labels shown in the design (e.g.
// different casing/wording), while still matching this screen's known
// statuses (Pending Pre-Approval, Approved, Awaiting Insurance, Result
// Available, Completed, Cancelled) exactly by keyword.
const derivePresentation = (
  rawStatus: string,
): {
  badgeBg: string;
  badgeText: string;
  bucket: "active" | "history";
  buttonType: ButtonAction | "none";
} => {
  const status = (rawStatus || "").toLowerCase();

  if (status.includes("cancel")) {
    return {
      badgeBg: Colors.errorBackground,
      badgeText: Colors.errorText,
      bucket: "history",
      buttonType: "view_details",
    };
  }
  if (status.includes("await") && status.includes("result")) {
    // "Result Awaited" — test ordered but no result yet, so there's nothing
    // to action on this card yet.
    return {
      badgeBg: Colors.backgroundCardLight,
      badgeText: Colors.secondary,
      bucket: "active",
      buttonType: "none",
    };
  }
  if (status.includes("result")) {
    return {
      badgeBg: Colors.successBackground,
      badgeText: Colors.successText,
      bucket: "history",
      buttonType: "view_result",
    };
  }
  if (status.includes("sign")) {
    // "Signed" (ordstat_name) — a signed lab/radiology order still belongs
    // under Active orders (per user confirmation), even though its badge is
    // success-styled ("badge-outline-success") and the result can already
    // be viewed.
    return {
      badgeBg: Colors.successBackground,
      badgeText: Colors.successText,
      bucket: "active",
      buttonType: "view_result",
    };
  }
  if (status.includes("complete")) {
    return {
      badgeBg: Colors.successBackground,
      badgeText: Colors.successText,
      bucket: "history",
      buttonType: "view_result",
    };
  }
  if (status.includes("approv") && !status.includes("pending")) {
    return {
      badgeBg: Colors.successBackground,
      badgeText: Colors.successText,
      bucket: "active",
      buttonType: "book",
    };
  }
  if (
    status.includes("pending") ||
    status.includes("await") ||
    status.includes("insurance")
  ) {
    return {
      badgeBg: Colors.warningBackground,
      badgeText: Colors.warningText,
      bucket: "active",
      buttonType: "call",
    };
  }
  // Unrecognized status (e.g. "Booked" — this endpoint currently returns
  // appointment-shaped rows, not a distinct pending/approved order
  // lifecycle) — keep it visible under Active with a neutral badge, and
  // default to "view details" rather than guessing at "call" or "book"
  // since neither action is known to be correct for this status.
  return {
    badgeBg: Colors.inactive,
    badgeText: Colors.textLabel,
    bucket: "active",
    buttonType: "view_details",
  };
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Order id currently resolving its provider for "Book appointment" —
  // guards against double-tap and drives the button's loading state.
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);
  const HOSPITAL_PHONE = "+971800444444";

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const [userId, orgId, roleId, patientId, visitId] = await Promise.all([
          fetchDataFromLocalStorage("sg_userId"),
          fetchDataFromLocalStorage("sg_org_id"),
          fetchDataFromLocalStorage("sg_roleId"),
          fetchDataFromLocalStorage("sg_patientId"),
          fetchDataFromLocalStorage("sg_visitId"),
        ]);

        const response = await callSuggestusAPI(
          spd_processId_config.hosapp_get_trn_order_all_ehg_pntapp,
          {
            p_user_id: userId ?? "",
            p_org_id: orgId ?? "",
            p_role_id: roleId ?? "",
            p_patient_id: patientId ?? "",
            p_visit_id: visitId ?? "",
            p_wkl_date_range_startDate: "",
            p_wkl_date_range_endDate: "",
            p_wkl_status: "",
            p_wkl_priority: "",
            p_wkl_search_text: "",
            p_from_location_type: "",
            p_from_location: "",
            p_location: "",
            p_additional_attributes: "",
            p_process_type: "",
            p_internal_flag: "",
            p_type: "LAB",
          },
        );

        if (response?.returnCode === true && response.returnData?.length > 0) {
          const mapped: OrderItem[] = response.returnData.map((r: any) => {
            const rawStatus = r.ordstat_name ?? r.ord_status ?? "";
            const presentation = derivePresentation(rawStatus);

            return {
              id: String(r.ord_id ?? r.p_ord_id ?? Math.random()),
              title: r.ord_description ?? r.ord_description_medication ?? "",
              status: rawStatus,
              doctor:
                r.visit_doctor_description ??
                r.org_user_name ??
                r.ord_sign_user_name ??
                r.ord_create_user_name ??
                "",
              date:
                r.ord_start_timestamp_formatted ??
                r.ord_order_timestamp_formatted ??
                r.vst_date ??
                "",
              department:
                r.ord_type ?? r.ord_group ?? r.ord_location_identifier ?? "",
              bucket: presentation.bucket,
              // Backend can send multiple actions as a "~"-delimited
              // string (e.g. "call~book~view_result") — parseButtonTypes
              // renders one button per valid action, none if blank/unknown.
              buttonType: parseButtonTypes("call~book~view_result"),
              findings: r.findings ?? "",
              recommendations: r.recommendations ?? "",
              reason: r.ord_cancel_remarks ?? "",
              docUrl: resolveDocUrl(
                r.download_doc_path ?? r.doc_path ?? r.spdFilePath ?? "",
              ),
              docName: r.doc_uploaded_filename ?? r.doc_name ?? "Result",
            };
          });
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (e) {
        console.error("Error fetching orders:", e);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const departmentOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(orders.map((o) => o.department).filter(Boolean))),
    ],
    [orders],
  );

  // Filter Orders based on active tab and selected department filter
  const currentOrdersList = orders.filter(
    (order) => order.bucket === activeTab,
  );
  const filteredOrders = currentOrdersList.filter((order) => {
    if (selectedDepartment === "All") return true;
    return order.department === selectedDepartment;
  });

  const handleCallPress = (order: OrderItem) => {
    if (Platform.OS === "web") {
      Toast.show({
        type: "info",
        text1: "Call Action Not Supported",
        text2: "Unable to initiate a call on this device.",
      });
      return;
    }

    Linking.openURL(`tel:${HOSPITAL_PHONE}`).catch(() => {
      Toast.show({
        type: "info",
        text1: "Call Failed",
        text2: "Unable to initiate a call on this device.",
      });
    });
  };

  // Loosely matches a provider row to the order's free-text doctor field —
  // tolerant of a "Dr."/"Dr" prefix or extra whitespace differing between
  // the two sources, since they come from different backend fields.
  const findMatchingProvider = (rows: any[], rawDoctorName: string) => {
    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .trim()
        .replace(/^dr\.?\s+/, "")
        .replace(/\s+/g, " ");

    const target = normalize(rawDoctorName);
    if (!target) return undefined;

    const nameOf = (r: any) => normalize(r.resource_name ?? r.name ?? "");
    return (
      rows.find((r) => nameOf(r) === target) ??
      rows.find((r) => nameOf(r).includes(target) || target.includes(nameOf(r)))
    );
  };

  // Handle Book Appointment — order cards always name a specific doctor, so
  // rather than making the user re-pick them from the full provider list,
  // look that doctor up and jump straight into the booking chain with them
  // pre-selected: PatientDetails (which auto-advances to AppointmentReason
  // once a patient + doctor are both known) → ScheduleBook → ConfirmScreen.
  // If no matching provider is found (e.g. they're no longer bookable),
  // tell the user instead of opening a booking flow with nothing behind it.
  const handleBook = async (order: OrderItem) => {
    if (bookingOrderId) return;
    setBookingOrderId(order.id);
    try {
      const patientId = await fetchDataFromLocalStorage("sg_patientId");
      const now = new Date();
      const response = await callSuggestusAPI(
        spd_processId_config.hospapp_get_resources,
        {
          p_patient_id: patientId ?? "",
          p_resource_code: "",
          p_month: now.getMonth() + 1,
          p_year: now.getFullYear(),
          p_process_type: "",
          p_visit_id: null,
          p_category_code: "CAT005",
        },
      );

      const rows: any[] =
        response?.returnCode === true && Array.isArray(response.returnData)
          ? response.returnData
          : [];
      const matched = findMatchingProvider(rows, order.doctor);

      if (!matched) {
        Toast.show({
          type: "info",
          text1: "Provider Not Available",
          text2: `${order.doctor || "This provider"} is not available for booking right now.`,
        });
        return;
      }

      navigation.navigate("HomeTab", {
        screen: "PatientDetails",
        params: {
          doctorId: String(matched.resource_id ?? matched.id ?? ""),
          doctorName: matched.resource_name ?? matched.name ?? order.doctor,
          specialty: matched.dpt_description ?? matched.dept_name ?? "",
          avatar: matched.resource_image_url ?? "",
          hospital: matched.org_name ?? "",
        },
      });
    } catch (e) {
      console.error("Error booking appointment from order:", e);
      Toast.show({
        type: "error",
        text1: "Something Went Wrong",
        text2: "Unable to check provider availability. Please try again.",
      });
    } finally {
      setBookingOrderId(null);
    }
  };

  // Render Status Badge with colors derived from the status keyword
  const renderStatusBadge = (status: string) => {
    const { badgeBg, badgeText } = derivePresentation(status);
    return (
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeText }]}>{status}</Text>
      </View>
    );
  };

  const ACTION_META: Record<
    ButtonAction,
    { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
  > = {
    call: { label: "Call", icon: "call-outline" },
    book: { label: "Book appointment", icon: "calendar-outline" },
    view_result: { label: "View Result", icon: "document-text-outline" },
    view_details: { label: "View Details", icon: "eye-outline" },
  };

  const handleActionPress = (order: OrderItem, action: ButtonAction) => {
    switch (action) {
      case "call":
        return handleCallPress(order);
      case "book":
        return handleBook(order);
      case "view_result":
        return navigation.navigate("HomeTab", {
          screen: "OrderResult",
          params: { order },
        });
      case "view_details":
        setSelectedOrder(order);
        setIsDetailsVisible(true);
        return;
    }
  };

  // Renders every action for this order as an evenly-spaced footer bar
  // (rather than free-floating pills), so 1-4 actions always lay out
  // predictably and never get clipped by the card's edge. Renders nothing
  // if the order has no actions (see ButtonAction/parseButtonTypes).
  const renderCardActions = (order: OrderItem) => {
    if (!order.buttonType || order.buttonType.length === 0) return null;
    return (
      <View style={styles.footerActionsRow}>
        {order.buttonType.map((action, index) => {
          const meta = ACTION_META[action];
          const isResolvingBooking =
            action === "book" && bookingOrderId === order.id;
          return (
            <TouchableOpacity
              key={action}
              style={[
                styles.footerActionButton,
                index < order.buttonType.length - 1 &&
                  styles.footerActionDivider,
              ]}
              onPress={() => handleActionPress(order, action)}
              activeOpacity={0.7}
              disabled={isResolvingBooking}
            >
              {isResolvingBooking ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name={meta.icon} size={15} color={Colors.primary} />
              )}
              <Text
                style={styles.footerActionText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <CustomHeader title="Orders" />

      {/* Tab Selector + Filter Row */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabSegmentContainer}>
          <CustomTabs
            tabs={["Active orders", "History"]}
            activeTab={activeTab === "active" ? "Active orders" : "History"}
            onTabChange={(tab) => {
              setActiveTab(tab === "Active orders" ? "active" : "history");
            }}
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDepartment !== "All" && styles.filterButtonActive,
          ]}
          onPress={() => setIsFilterVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options"
            size={20}
            color={
              selectedDepartment !== "All"
                ? Colors.background
                : Colors.secondary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Main Content List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 60 }}
          />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={Colors.inactive}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtext}>
              {selectedDepartment !== "All"
                ? `You don't have any ${selectedDepartment} orders in this list.`
                : `You don't have any orders under this category.`}
            </Text>
            {selectedDepartment !== "All" && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setSelectedDepartment("All")}
              >
                <Text style={styles.clearFilterButtonText}>
                  Show All Orders
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.card}>
              {/* Card Upper Info Panel */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{order.title}</Text>
                {activeTab === "active" && renderStatusBadge(order.status)}
              </View>

              <View style={styles.cardDetailsRow}>
                {/* Doctor */}
                <View style={styles.detailItem}>
                  {/* <Fontisto
                    name="doctor"
                    size={17}
                    color={Colors.primary}
                  /> */}
                  <Image
                    source={require("../../assets/images/doctor_person.png")}
                    style={{ width: 17, height: 17, tintColor: Colors.primary }}
                    resizeMode="contain"
                  />
                  <Text style={styles.detailText}>{order.doctor}</Text>
                </View>
                {/* Date */}
                <View style={styles.detailItem}>
                  {/* <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={17}
                    color={Colors.primary}
                  /> */}
                  <Image
                    source={require("../../assets/images/calendar.png")}
                    style={{ width: 17, height: 17, tintColor: Colors.primary }}
                    resizeMode="contain"
                  />
                  <Text style={styles.detailText}>
                    {order.date ? order.date.slice(0, -6).trim() : ""}
                  </Text>
                </View>
              </View>

              {/* Bottom Footer: department row + evenly-spaced action bar */}
              <View style={styles.cardFooter}>
                <View style={styles.footerDeptRow}>
                  <MaterialCommunityIcons
                    name={
                      order.department.toLowerCase().includes("lab")
                        ? "microscope"
                        : "hospital-building"
                    }
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.footerDeptText}>
                    {order.department}
                  </Text>
                </View>
                {renderCardActions(order)}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Department Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsFilterVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Department</Text>
              {/* <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsFilterVisible(false)}
              >
                <Ionicons name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity> */}
            </View>

            {departmentOptions.map((dept) => (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.filterOption,
                  selectedDepartment === dept && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setSelectedDepartment(dept);
                  setIsFilterVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedDepartment === dept &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  {dept === "All" ? "All Departments" : dept}
                </Text>
                {selectedDepartment === dept && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Details/Result Viewer Modal */}
      <Modal
        visible={isDetailsVisible && selectedOrder !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsDetailsVisible(false);
          setSelectedOrder(null);
        }}
      >
        <View style={styles.detailsModalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <View style={styles.detailsModalTitleRow}>
                <Ionicons
                  name={
                    selectedOrder?.status.toLowerCase().includes("cancel")
                      ? "warning-outline"
                      : "document-text-outline"
                  }
                  size={24}
                  color={
                    selectedOrder?.status.toLowerCase().includes("cancel")
                      ? Colors.errorText
                      : Colors.primary
                  }
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.detailsModalTitle}>
                  {selectedOrder?.status.toLowerCase().includes("cancel")
                    ? "Order Cancelled"
                    : "Diagnostic Report"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.detailsModalCloseButton}
                onPress={() => {
                  setIsDetailsVisible(false);
                  setSelectedOrder(null);
                }}
              >
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.detailsModalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.detailsModalOrderTitle}>
                {selectedOrder?.title}
              </Text>
              <View style={styles.detailsModalMetaRow}>
                <Text style={styles.detailsModalMetaLabel}>Department:</Text>
                <Text style={styles.detailsModalMetaVal}>
                  {selectedOrder?.department}
                </Text>
              </View>
              <View style={styles.detailsModalMetaRow}>
                <Text style={styles.detailsModalMetaLabel}>Ordered By:</Text>
                <Text style={styles.detailsModalMetaVal}>
                  {selectedOrder?.doctor}
                </Text>
              </View>
              <View style={styles.detailsModalMetaRow}>
                <Text style={styles.detailsModalMetaLabel}>Date:</Text>
                <Text style={styles.detailsModalMetaVal}>
                  {selectedOrder?.date}
                </Text>
              </View>

              <View style={styles.detailsModalDivider} />

              {selectedOrder?.status.toLowerCase().includes("cancel") ? (
                <View>
                  <Text style={styles.detailsSectionTitle}>
                    Cancellation Details
                  </Text>
                  <Text style={styles.detailsSectionBody}>
                    {selectedOrder.reason}
                  </Text>

                  <TouchableOpacity
                    style={styles.detailsActionSupportBtn}
                    onPress={() => {
                      setIsDetailsVisible(false);
                      setSelectedOrder(null);
                      Alert.alert(
                        "Support Helpline",
                        "Routing to Emirates Hospital support helpline at +971 800 444.",
                      );
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color={Colors.background}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.detailsActionSupportTxt}>
                      Contact Support
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.detailsSectionTitle}>
                    Observations / Findings
                  </Text>
                  <Text style={styles.detailsSectionBody}>
                    {selectedOrder?.findings ||
                      "Findings are still being processed by the diagnostic laboratory."}
                  </Text>

                  {selectedOrder?.recommendations && (
                    <>
                      <Text style={styles.detailsSectionTitle}>
                        Recommendations
                      </Text>
                      <Text style={styles.detailsSectionBody}>
                        {selectedOrder.recommendations}
                      </Text>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.detailsActionDownloadBtn}
                    onPress={() => {
                      Alert.alert(
                        "Download Report",
                        "Your report PDF is preparing for download. Check notification shade.",
                        [{ text: "OK" }],
                      );
                    }}
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={Colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.detailsActionDownloadTxt}>
                      Download Signed PDF
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: Colors.inactive,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    marginLeft: 5,
    fontFamily: FontFamilies.bold,
  },
  tabWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
  },
  tabSegmentContainer: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundCardLight,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    flexShrink: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamilies.semiBold,
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
    flexShrink: 1,
  },
  cardFooter: {
    backgroundColor: Colors.backgroundOverlayVeryLight,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  footerDeptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerDeptText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  // Evenly-spaced action bar below the department row — each action gets
  // an equal-width slot so 1-4 actions always lay out predictably instead
  // of overflowing/clipping like free-floating pills would.
  footerActionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  footerActionDivider: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  footerActionText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFilterButton: {
    borderWidth: 1.2,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFilterButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  closeButton: {
    padding: 4,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  filterOptionSelected: {
    backgroundColor: "transparent",
  },
  filterOptionText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  // Details Modal Styles
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  detailsModalContent: {
    backgroundColor: Colors.background,
    width: "100%",
    maxWidth: width * 0.9,
    borderRadius: 16,
    maxHeight: "80%",
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  detailsModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsModalTitle: {
    fontSize: 17,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  detailsModalCloseButton: {
    padding: 4,
  },
  detailsModalBody: {
    marginTop: 16,
  },
  detailsModalOrderTitle: {
    fontSize: 19,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    marginBottom: 12,
  },
  detailsModalMetaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailsModalMetaLabel: {
    width: 100,
    fontSize: 13.5,
    color: Colors.label,
    fontFamily: FontFamilies.medium,
  },
  detailsModalMetaVal: {
    flex: 1,
    fontSize: 13.5,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  detailsModalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  detailsSectionTitle: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
    marginBottom: 8,
  },
  detailsSectionBody: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.regular,
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsActionDownloadBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: Colors.background,
  },
  detailsActionDownloadTxt: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: FontFamilies.bold,
  },
  detailsActionSupportBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: Colors.primary,
  },
  detailsActionSupportTxt: {
    fontSize: 14,
    color: Colors.background,
    fontFamily: FontFamilies.bold,
  },
});
