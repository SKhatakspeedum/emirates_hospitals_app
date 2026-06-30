import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";

const { width } = Dimensions.get("window");

export default function ProductDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { product } = route.params || {
        product: {
            id: "calvit-l",
            name: "Calvit-L",
            tabs: "10 Tabs",
            price: "AED 5.80",
            image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300",
            bgColor: "#FFF3E0",
        }
    };

    const [isNutritionalExpanded, setIsNutritionalExpanded] = useState(false);
    const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <CustomHeader title="Catalogue" onBackPress={() => navigation.goBack()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Image Section */}
                <View style={styles.imageSection}>
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                    {/* Pagination Dots */}
                    <View style={styles.pagingContainer}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </View>

                {/* Details Card (Light Blue Card) */}
                <View style={styles.detailsCard}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    <Text style={styles.productVendor}>Sun Pharma</Text>
                    <View style={styles.divider} />

                    <Text style={styles.sectionHeader}>Details</Text>
                    <Text style={styles.detailsText}>
                        Proesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam quis risus eget urna mollis ornare vel eu leo.
                    </Text>

                    {/* Nutritional Facts Accordion */}
                    <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => setIsNutritionalExpanded(!isNutritionalExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.accordionTitle}>Nutritional facts</Text>
                        <Ionicons
                            name={isNutritionalExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#A0AEC0"
                        />
                    </TouchableOpacity>
                    {isNutritionalExpanded && (
                        <View style={styles.accordionContent}>
                            <Text style={styles.contentText}>
                                Contains Calcium Carbonate IP 1.25g equivalent to elemental Calcium 500mg and Vitamin D3 IP 250 IU.
                            </Text>
                        </View>
                    )}

                    {/* Reviews Accordion */}
                    <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => setIsReviewsExpanded(!isReviewsExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.accordionTitle}>Reviews</Text>
                        <Ionicons
                            name={isReviewsExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#A0AEC0"
                        />
                    </TouchableOpacity>
                    {isReviewsExpanded && (
                        <View style={styles.accordionContent}>
                            <Text style={styles.contentText}>
                                ⭐ 4.8/5 - Based on 124 customer reviews. Extremely effective for calcium deficiency.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Sticky Action Bar */}
            <View style={styles.bottomBar}>
                <Text style={styles.bottomPrice}>{product.price}</Text>
                <TouchableOpacity 
                    style={styles.continueButton} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("Cart")}
                >
                    <Text style={styles.continueText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={styles.continueIcon} />
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
    scrollView: {
        backgroundColor: "#F4F8FC",
    },
    scrollContent: {
        paddingBottom: 90,
    },
    imageSection: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 20,
    },
    productImage: {
        width: width * 0.65,
        height: 220,
    },
    pagingContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        gap: 6,
    },
    dot: {
        width: 14,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E2E8F0",
    },
    activeDot: {
        backgroundColor: "#FFA000",
    },
    detailsCard: {
        backgroundColor: "#F4F8FC",
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flex: 1,
    },
    productTitle: {
        fontSize: 22,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        marginBottom: 4,
    },
    productVendor: {
        fontSize: 13,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 15,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        marginBottom: 8,
    },
    detailsText: {
        fontSize: 14,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        lineHeight: 20,
        marginBottom: 20,
    },
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    accordionTitle: {
        fontSize: 15,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    accordionContent: {
        paddingBottom: 12,
        paddingHorizontal: 4,
    },
    contentText: {
        fontSize: 13,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        lineHeight: 18,
    },
    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottomPrice: {
        fontSize: 18,
        fontFamily: "QuicksandBold",
        color: Colors.secondary,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    continueText: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: "#FFFFFF",
        marginRight: 8,
    },
    continueIcon: {
        marginTop: 1,
    },
});
