import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

const { width } = Dimensions.get('window');

// Custom Type Definitions for Orders
interface OrderItem {
    id: string;
    title: string;
    status: 'Pending Pre-Approval' | 'Approved' | 'Awaiting Insurance' | 'Result Available' | 'Completed' | 'Cancelled';
    doctor: string;
    date: string;
    department: 'Radiology' | 'Lab';
    buttonType: 'call' | 'book' | 'view_result' | 'view_details';
    // Result details
    findings?: string;
    recommendations?: string;
    reason?: string;
}

// Mock Data
const ACTIVE_ORDERS: OrderItem[] = [
    {
        id: 'active1',
        title: 'MRI Brain',
        status: 'Pending Pre-Approval',
        doctor: 'Dr. Omar Al Suwaidi',
        date: 'Feb 20, 2026',
        department: 'Radiology',
        buttonType: 'call',
        findings: 'Pending pre-approval from insurance provider. Expected review within 24-48 hours.',
    },
    {
        id: 'active2',
        title: 'CT Abdomen',
        status: 'Approved',
        doctor: 'Dr. Omar Al Suwaidi',
        date: 'Feb 18, 2026',
        department: 'Radiology',
        buttonType: 'book',
    },
    {
        id: 'active3',
        title: 'Lipid Profile',
        status: 'Awaiting Insurance',
        doctor: 'Dr. Rania Ahmed',
        date: 'Feb 15, 2026',
        department: 'Lab',
        buttonType: 'call',
        findings: 'Awaiting response from primary health insurance policy check.',
    },
];

const HISTORY_ORDERS: OrderItem[] = [
    {
        id: 'hist1',
        title: 'MRI Brain',
        status: 'Result Available',
        doctor: 'Dr. Omar Al Suwaidi',
        date: 'Feb 20, 2026',
        department: 'Radiology',
        buttonType: 'view_result',
        findings: 'No acute intracranial pathology identified. Brain parenchyma demonstrates normal signal intensity and morphology. Ventricles and extra-axial CSF spaces are within normal limits for age.',
        recommendations: 'Clinical correlation as indicated. Routine follow-up.',
    },
    {
        id: 'hist2',
        title: 'CT Abdomen',
        status: 'Completed',
        doctor: 'Dr. Omar Al Suwaidi',
        date: 'Feb 18, 2026',
        department: 'Radiology',
        buttonType: 'view_result',
        findings: 'Lungs, liver, spleen, gallbladder, pancreas, and kidneys are within normal limits. No free fluid or air in the peritoneal cavity. Normal bowel gas pattern.',
        recommendations: 'No active follow-up needed. Maintain regular yearly health checkups.',
    },
    {
        id: 'hist3',
        title: 'CBC (Complete Blood Count)',
        status: 'Result Available',
        doctor: 'Dr. Rania Ahmed',
        date: 'Feb 15, 2026',
        department: 'Lab',
        buttonType: 'view_result',
        findings: 'Hemoglobin: 14.2 g/dL (Normal). WBC: 6.8 x10^3/uL (Normal). Platelets: 250 x10^3/uL (Normal). Red blood cell indices are normal.',
        recommendations: 'Values are within expected reference ranges. Maintain balanced diet.',
    },
    {
        id: 'hist4',
        title: 'Lipid Profile',
        status: 'Cancelled',
        doctor: 'Dr. Rania Ahmed',
        date: 'Feb 15, 2026',
        department: 'Lab',
        buttonType: 'view_details',
        reason: 'Cancelled by patient. Rescheduled to a different date or laboratory. No cancellation fee was charged.',
    },
];

export default function OrdersScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [selectedDepartment, setSelectedDepartment] = useState<'All' | 'Radiology' | 'Lab'>('All');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    // Filter Orders based on active tab and selected department filter
    const currentOrdersList = activeTab === 'active' ? ACTIVE_ORDERS : HISTORY_ORDERS;
    const filteredOrders = currentOrdersList.filter((order) => {
        if (selectedDepartment === 'All') return true;
        return order.department === selectedDepartment;
    });

    // Handle Call simulation
    const handleCall = (department: string) => {
        const phoneNumber = '+971800444';
        Alert.alert(
            'Contact Department',
            `Would you like to call the ${department} department?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call',
                    onPress: () => {
                        Linking.openURL(`tel:${phoneNumber}`).catch(() => {
                            Alert.alert('Error', 'Unable to initiate call on this device.');
                        });
                    },
                },
            ]
        );
    };

    // Handle Book Appointment Navigation
    const handleBook = (order: OrderItem) => {
        navigation.navigate('HomeTab', {
            screen: 'AppointmentType',
            params: {
                doctorId: '10',
                doctorName: order.doctor,
                specialty: `${order.department} Specialist`,
                avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
                patientName: 'John Doe',
            },
        });
    };

    // Render Status Badge with custom styles matching the designs
    const renderStatusBadge = (status: OrderItem['status']) => {
        let badgeBgColor = '#F2F4F7';
        let badgeTextColor = '#667085';

        switch (status) {
            case 'Pending Pre-Approval':
                badgeBgColor = '#FFF3D6'; // light orange
                badgeTextColor = '#B78103'; // dark orange/yellow
                break;
            case 'Approved':
            case 'Result Available':
                badgeBgColor = '#E2FAEC'; // light green
                badgeTextColor = '#0F9F47'; // dark green
                break;
            case 'Awaiting Insurance':
                badgeBgColor = '#FFF3D6'; // light orange/yellow
                badgeTextColor = '#D45D00'; // orange
                break;
            case 'Completed':
                badgeBgColor = '#E8F4FD'; // light blue
                badgeTextColor = Colors.secondary; // primary blue tint
                break;
            case 'Cancelled':
                badgeBgColor = '#FDE8E8'; // light red
                badgeTextColor = '#E02424'; // dark red
                break;
        }

        return (
            <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
                <Text style={[styles.badgeText, { color: badgeTextColor }]}>{status}</Text>
            </View>
        );
    };

    // Helper for Order Cards Actions
    const renderCardAction = (order: OrderItem) => {
        switch (order.buttonType) {
            case 'call':
                return (
                    <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={() => handleCall(order.department)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call-outline" size={14} color={Colors.primary} style={styles.actionIcon} />
                        <Text style={styles.cardActionText}>Call</Text>
                    </TouchableOpacity>
                );
            case 'book':
                return (
                    <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={() => handleBook(order)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cardActionText}>Book appointment</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} style={styles.actionIconRight} />
                    </TouchableOpacity>
                );
            case 'view_result':
                return (
                    <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={() => {
                            navigation.navigate('HomeTab', {
                                screen: 'OrderResult',
                                params: { order },
                            });
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cardActionText}>View Result</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} style={styles.actionIconRight} />
                    </TouchableOpacity>
                );
            case 'view_details':
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
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} style={styles.actionIconRight} />
                    </TouchableOpacity>
                );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            {/* Screen Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={22} color="#262626" style={{ marginRight: 4 }} />
                    <Text style={styles.headerTitle}>Orders</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Selector + Filter Row */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabSegmentContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabSegmentButton,
                            activeTab === 'active' && styles.tabSegmentButtonActive,
                        ]}
                        onPress={() => setActiveTab('active')}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabSegmentText,
                                activeTab === 'active' && styles.tabSegmentTextActive,
                            ]}
                        >
                            Active orders
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabSegmentButton,
                            activeTab === 'history' && styles.tabSegmentButtonActive,
                        ]}
                        onPress={() => setActiveTab('history')}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabSegmentText,
                                activeTab === 'history' && styles.tabSegmentTextActive,
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
                        selectedDepartment !== 'All' && styles.filterButtonActive,
                    ]}
                    onPress={() => setIsFilterVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="options-outline"
                        size={20}
                        color={selectedDepartment !== 'All' ? '#fff' : Colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Main Content List */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={80} color="#D0D4DF" style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyTitle}>No Orders Found</Text>
                        <Text style={styles.emptySubtext}>
                            {selectedDepartment !== 'All'
                                ? `You don't have any ${selectedDepartment} orders in this list.`
                                : `You don't have any orders under this category.`}
                        </Text>
                        {selectedDepartment !== 'All' && (
                            <TouchableOpacity
                                style={styles.clearFilterButton}
                                onPress={() => setSelectedDepartment('All')}
                            >
                                <Text style={styles.clearFilterButtonText}>Show All Orders</Text>
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
                                    <Ionicons name="person-outline" size={16} color={Colors.secondary} />
                                    <Text style={styles.detailText}>{order.doctor}</Text>
                                </View>
                                {/* Date */}
                                <View style={styles.detailItem}>
                                    <Ionicons name="calendar-outline" size={16} color={Colors.secondary} />
                                    <Text style={styles.detailText}>{order.date}</Text>
                                </View>
                            </View>

                            {/* Bottom Strip */}
                            <View style={styles.bottomStrip}>
                                <View style={styles.bottomLeftCol}>
                                    <Ionicons
                                        name={order.department === 'Radiology' ? 'business-outline' : 'flask-outline'}
                                        size={16}
                                        color={Colors.primary}
                                    />
                                    <Text style={styles.bottomLeftText}>{order.department}</Text>
                                </View>
                                <View style={styles.bottomRightCol}>{renderCardAction(order)}</View>
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

                        {(['All', 'Radiology', 'Lab'] as const).map((dept) => (
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
                                        selectedDepartment === dept && styles.filterOptionTextSelected,
                                    ]}
                                >
                                    {dept === 'All' ? 'All Departments' : dept}
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
                                        selectedOrder?.status === 'Cancelled'
                                            ? 'warning-outline'
                                            : 'document-text-outline'
                                    }
                                    size={24}
                                    color={selectedOrder?.status === 'Cancelled' ? '#E02424' : Colors.primary}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.detailsModalTitle}>
                                    {selectedOrder?.status === 'Cancelled' ? 'Order Cancelled' : 'Diagnostic Report'}
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

                        <ScrollView style={styles.detailsModalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.detailsModalOrderTitle}>{selectedOrder?.title}</Text>
                            <View style={styles.detailsModalMetaRow}>
                                <Text style={styles.detailsModalMetaLabel}>Department:</Text>
                                <Text style={styles.detailsModalMetaVal}>{selectedOrder?.department}</Text>
                            </View>
                            <View style={styles.detailsModalMetaRow}>
                                <Text style={styles.detailsModalMetaLabel}>Ordered By:</Text>
                                <Text style={styles.detailsModalMetaVal}>{selectedOrder?.doctor}</Text>
                            </View>
                            <View style={styles.detailsModalMetaRow}>
                                <Text style={styles.detailsModalMetaLabel}>Date:</Text>
                                <Text style={styles.detailsModalMetaVal}>{selectedOrder?.date}</Text>
                            </View>

                            <View style={styles.detailsModalDivider} />

                            {selectedOrder?.status === 'Cancelled' ? (
                                <View>
                                    <Text style={styles.detailsSectionTitle}>Cancellation Details</Text>
                                    <Text style={styles.detailsSectionBody}>{selectedOrder.reason}</Text>

                                    <TouchableOpacity
                                        style={styles.detailsActionSupportBtn}
                                        onPress={() => {
                                            setIsDetailsVisible(false);
                                            setSelectedOrder(null);
                                            Alert.alert('Support Helpline', 'Routing to Emirates Hospital support helpline at +971 800 444.');
                                        }}
                                    >
                                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.detailsActionSupportTxt}>Contact Support</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <Text style={styles.detailsSectionTitle}>Observations / Findings</Text>
                                    <Text style={styles.detailsSectionBody}>
                                        {selectedOrder?.findings || 'Findings are still being processed by the diagnostic laboratory.'}
                                    </Text>

                                    {selectedOrder?.recommendations && (
                                        <>
                                            <Text style={styles.detailsSectionTitle}>Recommendations</Text>
                                            <Text style={styles.detailsSectionBody}>{selectedOrder.recommendations}</Text>
                                        </>
                                    )}

                                    <TouchableOpacity
                                        style={styles.detailsActionDownloadBtn}
                                        onPress={() => {
                                            Alert.alert(
                                                'Download Report',
                                                'Your report PDF is preparing for download. Check notification shade.',
                                                [{ text: 'OK' }]
                                            );
                                        }}
                                    >
                                        <Ionicons name="download-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                                        <Text style={styles.detailsActionDownloadTxt}>Download Signed PDF</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 12,
        marginVertical: 15,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.text,
        marginLeft: 5,
        fontFamily: 'QuicksandBold',
    },
    tabWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 10,
        alignItems: 'center',
        gap: 12,
    },
    tabSegmentContainer: {
        flex: 1,
        flexDirection: 'row',
        height: 42,
        backgroundColor: '#EBEBEF',
        borderRadius: 10,
        padding: 3,
    },
    tabSegmentButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    tabSegmentButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabSegmentText: {
        fontSize: 14,
        color: '#757575',
        fontFamily: 'QuicksandSemiBold',
    },
    tabSegmentTextActive: {
        color: '#232323',
        fontFamily: 'QuicksandBold',
    },
    filterButton: {
        width: 42,
        height: 42,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 16,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 17,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
        flexShrink: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontFamily: 'QuicksandSemiBold',
    },
    cardDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    detailText: {
        fontSize: 13.5,
        color: '#4B5563',
        fontFamily: 'QuicksandMedium',
        flexShrink: 1,
    },
    bottomStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.lightgray,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    bottomLeftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bottomLeftText: {
        fontSize: 14,
        color: Colors.primary,
        fontFamily: 'QuicksandSemiBold',
    },
    bottomRightCol: {
        justifyContent: 'center',
    },
    cardActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: Colors.background,
    },
    cardActionText: {
        fontSize: 13,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
    },
    actionIcon: {
        marginRight: 6,
    },
    actionIconRight: {
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'QuicksandMedium',
        textAlign: 'center',
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
        fontFamily: 'QuicksandBold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
    },
    closeButton: {
        padding: 4,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    filterOptionSelected: {
        backgroundColor: 'transparent',
    },
    filterOptionText: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'QuicksandMedium',
    },
    filterOptionTextSelected: {
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
    },
    // Details Modal Styles
    detailsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    detailsModalContent: {
        backgroundColor: Colors.background,
        width: '100%',
        maxWidth: width * 0.9,
        borderRadius: 16,
        maxHeight: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    detailsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 12,
    },
    detailsModalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsModalTitle: {
        fontSize: 17,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
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
        fontFamily: 'QuicksandBold',
        marginBottom: 12,
    },
    detailsModalMetaRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailsModalMetaLabel: {
        width: 100,
        fontSize: 13.5,
        color: '#6B7280',
        fontFamily: 'QuicksandMedium',
    },
    detailsModalMetaVal: {
        flex: 1,
        fontSize: 13.5,
        color: Colors.text,
        fontFamily: 'QuicksandSemiBold',
    },
    detailsModalDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 16,
    },
    detailsSectionTitle: {
        fontSize: 15,
        color: Colors.primary,
        fontFamily: 'QuicksandBold',
        marginBottom: 8,
    },
    detailsSectionBody: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'QuicksandRegular',
        lineHeight: 22,
        marginBottom: 20,
    },
    detailsActionDownloadBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontFamily: 'QuicksandBold',
    },
    detailsActionSupportBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 11,
        marginTop: 10,
        marginBottom: 15,
        backgroundColor: Colors.primary,
    },
    detailsActionSupportTxt: {
        fontSize: 14,
        color: '#fff',
        fontFamily: 'QuicksandBold',
    },
});
