import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

const { width } = Dimensions.get('window');

export default function OrderResultScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const order = route.params?.order || {};

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            {/* Report Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={22} color="#262626" style={{ marginRight: 4 }} />
                    <Text style={styles.headerTitle}>Orders</Text>
                </TouchableOpacity>
            </View>

            {/* PDF Viewer Page Frame */}
            <ScrollView
                style={styles.pdfScroll}
                contentContainerStyle={styles.pdfScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pdfPage}>
                    {/* Logo header */}
                    <View style={styles.pdfHeaderRow}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.logoCol}>
                            <Text style={styles.logoArabic}>مجموعة مستشفيات الإمارات</Text>
                            <Text style={styles.logoEnglish}>Emirates Hospitals Group</Text>
                        </View>
                    </View>

                    {/* Patient info details */}
                    <View style={styles.pdfMetaTable}>
                        <View style={styles.pdfMetaCol}>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Name:</Text> Mr. Test123</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Age/Gender:</Text> 20 Y/M</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Address:</Text> </Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Location:</Text> ABU DHABI, ABU DHABI</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Doctor:</Text> Sick Leave Review</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Department:</Text> General</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Rate Plan:</Text> Cash</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Consulting Doctor:</Text> Sick Leave Review</Text>
                        </View>
                        <View style={[styles.pdfMetaCol, { paddingLeft: 10 }]}>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>MR No:</Text> MRG00020</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Visit ID:</Text> OP003388</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Visit Date:</Text> 03-03-2020 09:40</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Discharge Date:</Text> </Text>
                        </View>
                    </View>

                    <View style={styles.pdfDivider} />

                    {/* Personal History */}
                    <Text style={styles.pdfSectionHeader}>Personal, Family & Social History</Text>
                    <View style={styles.pdfHistoryContent}>
                        <Text style={styles.pdfHistoryText}><Text style={styles.boldText}>Marital Status:</Text> Single ,</Text>
                        <Text style={styles.pdfHistoryText}><Text style={styles.boldText}>Family History:</Text> Normal</Text>
                        <Text style={styles.pdfHistoryText}><Text style={styles.boldText}>Social History:</Text> Others --</Text>
                        <Text style={styles.pdfHistoryText}><Text style={styles.boldText}>Past Medical History:</Text> None ,</Text>
                    </View>

                    <View style={styles.pdfDivider} />

                    {/* Prescriptions */}
                    <Text style={[styles.pdfSectionHeader, { textDecorationLine: 'underline' }]}>Prescriptions</Text>
                    <View style={styles.pdfGridHeader}>
                        <Text style={[styles.pdfGridHeaderText, { flex: 3 }]}>Investigation</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 3 }]}>Instructions</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 3 }]}>Special Instructions</Text>
                    </View>
                    <View style={styles.pdfGridRow}>
                        <Text style={[styles.pdfGridRowText, { flex: 3 }]}>
                            CBC{"\n"}BONE LENGTH STUDIES{"\n"}(ORTHOPANTOMOGRAM,{"\n"}SCANOGRAM)
                        </Text>
                        <Text style={[styles.pdfGridRowText, { flex: 3 }]}></Text>
                        <Text style={[styles.pdfGridRowText, { flex: 3 }]}></Text>
                    </View>

                    <View style={{ height: 20 }} />

                    {/* Services Grid */}
                    <View style={styles.pdfGridHeader}>
                        <Text style={[styles.pdfGridHeaderText, { flex: 4 }]}>Service Name</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 1 }]}>Tooth No(s)</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 2 }]}>Instructions</Text>
                        <Text style={[styles.pdfGridHeaderText, { flex: 2 }]}>Special Instructions</Text>
                    </View>
                    <View style={styles.pdfGridRow}>
                        <Text style={[styles.pdfGridRowText, { flex: 4, fontSize: 10 }]}>
                            1 of the following diagnostic imaging studies ordered: chest x-ray, CT, Ultrasound, MRI, PET, or nuclear medicine scans (IRL)
                        </Text>
                        <Text style={[styles.pdfGridRowText, { flex: 1, textAlign: 'center' }]}>1</Text>
                        <Text style={[styles.pdfGridRowText, { flex: 1 }]}></Text>
                        <Text style={[styles.pdfGridRowText, { flex: 2 }]}></Text>
                        <Text style={[styles.pdfGridRowText, { flex: 2 }]}></Text>
                    </View>

                    <View style={{ flex: 1, minHeight: 60 }} />

                    <View style={styles.pdfPageFooter}>
                        <Text style={styles.pdfPageFooterText}>Page 1 of 2</Text>
                    </View>
                </View>

                {/* Page 2 simulation */}
                <View style={[styles.pdfPage, { marginTop: 15 }]}>
                    <View style={styles.pdfHeaderRow}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.logoCol}>
                            <Text style={styles.logoArabic}>مجموعة مستشفيات الإمارات</Text>
                            <Text style={styles.logoEnglish}>Emirates Hospitals Group</Text>
                        </View>
                    </View>

                    {/* Detailed Report Text based on selected order findings */}
                    <Text style={[styles.pdfSectionHeader, { marginTop: 20 }]}>Diagnostic Findings Report</Text>
                    <View style={styles.pdfMetaTable}>
                        <View style={styles.pdfMetaCol}>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Order Name:</Text> {order.title}</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Referral Doctor:</Text> {order.doctor}</Text>
                        </View>
                        <View style={styles.pdfMetaCol}>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Date of Report:</Text> {order.date}</Text>
                            <Text style={styles.pdfMetaText}><Text style={styles.boldText}>Status:</Text> {order.status}</Text>
                        </View>
                    </View>

                    <View style={styles.pdfDivider} />

                    <Text style={styles.pdfSectionHeader}>Observations & Findings</Text>
                    <Text style={styles.pdfFindingsText}>
                        {order.findings || "Findings are within normal physical and clinical ranges for this study. The patient shows standard physiological metrics. Complete parameters have been recorded under ID OP003388."}
                    </Text>

                    {order.recommendations && (
                        <>
                            <Text style={styles.pdfSectionHeader}>Recommendations</Text>
                            <Text style={styles.pdfFindingsText}>
                                {order.recommendations}
                            </Text>
                        </>
                    )}

                    <View style={[styles.pdfDivider, { marginTop: 40 }]} />
                    <Text style={{ fontSize: 10, color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
                        Report electronically signed by Chief Medical Officer. Authenticated via Emirates Hospitals Group portal.
                    </Text>

                    <View style={{ flex: 1, minHeight: 120 }} />

                    <View style={styles.pdfPageFooter}>
                        <Text style={styles.pdfPageFooterText}>Page 2 of 2</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Controller overlay */}
            <View style={styles.floatingControlBar}>
                <Text style={styles.controlText}>Page 1 / 2</Text>
                <View style={styles.controlDivider} />
                <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Zoom Out', 'Zoom out simulation')}>
                    <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Search Report', 'Report text search is active.')}>
                    <Ionicons name="search" size={15} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Zoom In', 'Zoom in simulation')}>
                    <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
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
    pdfScroll: {
        flex: 1,
        backgroundColor: '#CCCCCC',
    },
    pdfScrollContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 90,
    },
    pdfPage: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        minHeight: 520,
    },
    pdfHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoCol: {
        alignItems: 'flex-end',
    },
    logoArabic: {
        fontSize: 12,
        color: '#00B5E2',
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    logoEnglish: {
        fontSize: 11,
        color: '#00B5E2',
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    pdfMetaTable: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    pdfMetaCol: {
        flex: 1,
    },
    pdfMetaText: {
        fontSize: 9.5,
        color: '#333333',
        marginBottom: 3.5,
        lineHeight: 13,
        fontFamily: 'System',
    },
    boldText: {
        fontWeight: 'bold',
    },
    pdfDivider: {
        height: 1,
        backgroundColor: '#DDDDDD',
        marginVertical: 12,
    },
    pdfSectionHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111111',
        marginBottom: 8,
        fontFamily: 'System',
    },
    pdfHistoryContent: {
        marginBottom: 10,
    },
    pdfHistoryText: {
        fontSize: 9.5,
        color: '#333333',
        marginBottom: 3.5,
        fontFamily: 'System',
    },
    pdfGridHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#111111',
        paddingBottom: 4,
        marginBottom: 6,
    },
    pdfGridHeaderText: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: '#111111',
        fontFamily: 'System',
    },
    pdfGridRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    pdfGridRowText: {
        fontSize: 9.5,
        color: '#333333',
        lineHeight: 13,
        fontFamily: 'System',
    },
    pdfPageFooter: {
        borderTopWidth: 0.5,
        borderTopColor: '#DDDDDD',
        paddingTop: 8,
        alignItems: 'flex-end',
        marginTop: 15,
    },
    pdfPageFooterText: {
        fontSize: 9.5,
        color: '#666666',
        fontFamily: 'System',
    },
    pdfFindingsText: {
        fontSize: 10.5,
        color: '#333333',
        lineHeight: 16,
        marginBottom: 15,
        fontFamily: 'System',
    },
    floatingControlBar: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(35, 35, 35, 0.85)',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    controlText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontFamily: 'QuicksandSemiBold',
    },
    controlDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    controlBtn: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
