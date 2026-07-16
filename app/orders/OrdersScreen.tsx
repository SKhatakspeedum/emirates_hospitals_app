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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import { FontFamilies } from "../config/fonts";
import CustomHeader from "../components/CustomHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

const { width } = Dimensions.get("window");

// Custom Type Definitions for Orders
interface OrderItem {
  id: string;
  title: string;
  status: string;
  doctor: string;
  date: string;
  department: string;
  bucket: "active" | "history";
  buttonType: "call" | "book" | "view_result" | "view_details";
  // Result details
  findings?: string;
  recommendations?: string;
  reason?: string;
}

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
  buttonType: OrderItem["buttonType"];
} => {
  const status = (rawStatus || "").toLowerCase();

  if (status.includes("cancel")) {
    return {
      badgeBg: "#FDE8E8",
      badgeText: "#E02424",
      bucket: "history",
      buttonType: "view_details",
    };
  }
  if (status.includes("result")) {
    return {
      badgeBg: "#E2FAEC",
      badgeText: "#0F9F47",
      bucket: "history",
      buttonType: "view_result",
    };
  }
  if (status.includes("complete")) {
    return {
      badgeBg: "#E8F4FD",
      badgeText: Colors.secondary,
      bucket: "history",
      buttonType: "view_result",
    };
  }
  if (status.includes("approv") && !status.includes("pending")) {
    return {
      badgeBg: "#E2FAEC",
      badgeText: "#0F9F47",
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
      badgeBg: "#FFF3D6",
      badgeText: "#B78103",
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
    badgeBg: "#F2F4F7",
    badgeText: "#667085",
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
            // This endpoint currently returns appointment-shaped rows
            // (appt_id/resource_name/dpt_description/appstat_name/etc. —
            // the same field set as the Appointments feature) rather than
            // a dedicated order/test-name field, so there's no clean
            // "what was ordered" value to read. Best available proxy:
            // department + visit subtype, falling back to whichever
            // order-specific field names show up if the backend later
            // adds them.
            const rawStatus =
              r.appstat_name ?? r.wkl_status ?? r.order_status ?? r.status ?? "";
            const presentation = derivePresentation(rawStatus);
            const histType = (r.appointment_history_type ?? "").toLowerCase();
            const bucket = r.appointment_history_type
              ? histType.includes("hist")
                ? "history"
                : "active"
              : presentation.bucket;

            return {
              id: String(
                r.p_appt_id ??
                  r.appt_id ??
                  r.wkl_id ??
                  r.order_id ??
                  r.trn_order_id ??
                  r.id ??
                  Math.random(),
              ),
              title:
                r.wkl_title ??
                r.order_title ??
                r.order_name ??
                r.test_name ??
                r.procedure_name ??
                (r.dpt_description && r.appsubtyp_name
                  ? `${r.dpt_description} - ${r.appsubtyp_name}`
                  : r.appsubtyp_name ?? r.dpt_description ?? ""),
              status: rawStatus,
              doctor:
                r.resource_name ??
                r.doctor_name ??
                r.ordering_doctor_name ??
                r.wkl_doctor_name ??
                "",
              date:
                r.appt_date_dashboard ??
                r.wkl_date ??
                r.order_date ??
                r.wkl_order_date ??
                r.created_date ??
                "",
              department:
                r.dpt_description ?? r.department ?? r.wkl_department ?? "",
              bucket,
              buttonType: presentation.buttonType,
              findings: r.findings ?? r.wkl_findings ?? r.result_findings ?? "",
              recommendations: r.recommendations ?? r.wkl_recommendations ?? "",
              reason: r.cancellation_reason ?? r.reason ?? r.wkl_reason ?? "",
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

  // Handle Call simulation
  const handleCall = (department: string) => {
    const phoneNumber = "+971800444";
    Alert.alert(
      "Contact Department",
      `Would you like to call the ${department} department?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert("Error", "Unable to initiate call on this device.");
            });
          },
        },
      ],
    );
  };

  // Handle Book Appointment Navigation
  const handleBook = (order: OrderItem) => {
    navigation.navigate("HomeTab", {
      screen: "AppointmentType",
      params: {
        doctorId: "10",
        doctorName: order.doctor,
        specialty: `${order.department} Specialist`,
        avatar: "https://randomuser.me/api/portraits/men/4.jpg",
        patientName: "John Doe",
      },
    });
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

  // Helper for Order Cards Actions
  const renderCardAction = (order: OrderItem) => {
    switch (order.buttonType) {
      case "call":
        return (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => handleCall(order.department)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="call"
              size={14}
              color={Colors.secondary}
              style={styles.actionIcon}
            />
            <Text style={styles.cardActionText}>Call</Text>
          </TouchableOpacity>
        );
      case "book":
        return (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => handleBook(order)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardActionText}>Book appointment</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={Colors.secondary}
              style={styles.actionIconRight}
            />
          </TouchableOpacity>
        );
      case "view_result":
        return (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => {
              navigation.navigate("HomeTab", {
                screen: "OrderResult",
                params: { order },
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cardActionText}>View Result</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={Colors.secondary}
              style={styles.actionIconRight}
            />
          </TouchableOpacity>
        );
      case "view_details":
        return (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => {
              setSelectedOrder(order);
              setIsDetailsVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cardActionText}>View Details</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={Colors.primary}
              style={styles.actionIconRight}
            />
          </TouchableOpacity>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <CustomHeader title="Orders" />

      {/* Tab Selector + Filter Row */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabSegmentContainer}>
          <TouchableOpacity
            style={[
              styles.tabSegmentButton,
              activeTab === "active" && styles.tabSegmentButtonActive,
            ]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === "active" && styles.tabSegmentTextActive,
              ]}
            >
              Active orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabSegmentButton,
              activeTab === "history" && styles.tabSegmentButtonActive,
            ]}
            onPress={() => setActiveTab("history")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabSegmentText,
                activeTab === "history" && styles.tabSegmentTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
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
            name="options-outline"
            size={20}
            color={
              selectedDepartment !== "All" ? Colors.background : Colors.primary
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
                {renderStatusBadge(order.status)}
              </View>

              <View style={styles.cardDetailsRow}>
                {/* Doctor */}
                <View style={styles.detailItem}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={Colors.secondary}
                  />
                  <Text style={styles.detailText}>{order.doctor}</Text>
                </View>
                {/* Date */}
                <View style={styles.detailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={Colors.secondary}
                  />
                  <Text style={styles.detailText}>{order.date}</Text>
                </View>
              </View>

              {/* Bottom Strip */}
              <View style={styles.bottomStrip}>
                <View style={styles.bottomLeftCol}>
                  <Ionicons
                    name={
                      order.department.toLowerCase().includes("lab")
                        ? "flask-outline"
                        : "business-outline"
                    }
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.bottomLeftText}>{order.department}</Text>
                </View>
                <View style={styles.bottomRightCol}>
                  {renderCardAction(order)}
                </View>
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsFilterVisible(false)}
              >
                <Ionicons name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
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
                      ? "#E02424"
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
    flexDirection: "row",
    height: 42,
    backgroundColor: "#EBEBEF",
    borderRadius: 10,
    padding: 3,
  },
  tabSegmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  tabSegmentButtonActive: {
    backgroundColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 15,
    color: Colors.label,
    fontFamily: FontFamilies.semiBold,
  },
  tabSegmentTextActive: {
    color: Colors.text,
    fontFamily: FontFamilies.bold,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
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
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: FontFamilies.medium,
    flexShrink: 1,
  },
  bottomStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.inactive,
    padding: 5,
    margin: 7,
    borderRadius: 8,
  },
  bottomLeftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomLeftText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamilies.semiBold,
  },
  bottomRightCol: {
    justifyContent: "center",
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
  },
  cardActionText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamilies.semiBold,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionIconRight: {
    marginLeft: 6,
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    shadowColor: "#000",
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
