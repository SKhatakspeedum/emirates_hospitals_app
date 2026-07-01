import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
    Dimensions,
    Image,
    Pressable,
} from "react-native";
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Mock Dynamic Data with Category Image URLs for future dynamic API integration
const CATEGORIES_DATA = [
    {
        id: "personal-care",
        label: "Personal Care",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150",
    },
    {
        id: "functional",
        label: "Functional",
        image: "https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?w=150",
    },
    {
        id: "analgesic",
        label: "Analgesic",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150",
    },
    {
        id: "gender-health",
        label: "Gender Health",
        image: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=150",
    },
];

const POPULAR_PRODUCTS = [
    {
        id: "flechos",
        name: "Flechos",
        tabs: "60 Tabs",
        price: "AED 32.00",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
        bgColor: "#F0EEFF",
    },
    {
        id: "l-lysine",
        name: "L-Lysine",
        tabs: "60 Tabs",
        price: "AED 48.50",
        image: "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?w=300",
        bgColor: "#E3F2FD",
    },
    {
        id: "vitamin-d3",
        name: "Vitamin D3",
        tabs: "15 Tabs",
        price: "AED 10.20",
        image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300",
        bgColor: "#E8F5E9",
    },
];

const RECOMMENDED_PRODUCTS = [
    {
        id: "calvit-l",
        name: "Calvit-L",
        tabs: "10 Tabs",
        price: "AED 5.80",
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300",
        bgColor: "#FFF3E0",
    },
    {
        id: "relibond",
        name: "Relibond",
        tabs: "30 Tabs",
        price: "AED 80.60",
        image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
        bgColor: "#EFEBE9",
    },
];

interface ProductGraphicProps {
    imageUri: string;
    bgColor: string;
    large?: boolean;
}

const ProductGraphic: React.FC<ProductGraphicProps> = ({ imageUri, bgColor, large }) => (
    <View style={large ? styles.graphicWrapperLarge : styles.graphicWrapper}>
        <View style={[large ? styles.imageCircleLarge : styles.imageCircle, { backgroundColor: bgColor }]}>
            <Image
                source={{ uri: imageUri }}
                style={large ? styles.medicineImageLarge : styles.medicineImage}
                resizeMode="cover"
            />
        </View>
    </View>
);

export default function MedicinesScreen() {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <CustomHeader title="Catalogue" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Upload Prescription Card */}
                <Pressable
                    android_ripple={{ color: "rgba(0, 0, 0, 0.08)" }}
                    style={({ pressed }) => [
                        styles.uploadCard,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                >
                    <View style={styles.uploadIconCircle}>
                        <Feather name="upload-cloud" size={24} color={Colors.background} />
                    </View>
                    <View style={styles.uploadTextContainer}>
                        <Text style={styles.uploadTitle}>Upload Prescription</Text>
                        <Text style={styles.uploadSubtitle}>
                            Upload image of valid prescription{"\n"}from your doctor
                        </Text>
                    </View>
                </Pressable>

                {/* Categories Section */}
                <View style={styles.categoriesOuterCard}>
                    <Text style={styles.categoriesSectionTitle}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                        {CATEGORIES_DATA.map((category) => (
                            <Pressable
                                key={category.id}
                                android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
                                style={({ pressed }) => [
                                    styles.categoryCard,
                                    {
                                        opacity: pressed ? 0.9 : 1,
                                        transform: [{ scale: pressed ? 0.96 : 1 }],
                                    }
                                ]}
                            >
                                {({ pressed }) => (
                                    <>
                                        <View
                                            style={[
                                                styles.categoryIconContainer,
                                                {
                                                    backgroundColor: pressed ? Colors.pressed : "#FFFFFF",
                                                    borderColor: pressed ? Colors.activeBorder : Colors.border,
                                                }
                                            ]}
                                        >
                                            <Image
                                                source={{ uri: category.image }}
                                                style={styles.categoryImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text style={styles.categoryLabel} numberOfLines={1}>{category.label}</Text>
                                    </>
                                )}
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Popular Product Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Popular Product</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllLink}>See all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
                    {POPULAR_PRODUCTS.map((product) => (
                        <Pressable
                            key={product.id}
                            android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
                            style={({ pressed }) => [
                                styles.productCard,
                                {
                                    backgroundColor: pressed ? Colors.pressed : Colors.background,
                                    borderColor: pressed ? Colors.activeBorder : Colors.border,
                                    opacity: pressed ? 0.9 : 1,
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                }
                            ]}
                            onPress={() => navigation.navigate("ProductDetails", { product })}
                        >
                            <ProductGraphic imageUri={product.image} bgColor={product.bgColor} />
                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                            <Text style={styles.productTabs}>{product.tabs}</Text>
                            <View style={styles.productFooter}>
                                <Text style={styles.productPrice}>{product.price}</Text>
                                <Pressable
                                    android_ripple={{ color: "rgba(255, 255, 255, 0.3)" }}
                                    style={({ pressed }) => [
                                        styles.addButton,
                                        pressed && { opacity: 0.8, transform: [{ scale: 0.9 }] }
                                    ]}
                                >
                                    <Ionicons name="add" size={14} color={Colors.background} />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Recommended Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recommended</Text>
                </View>

                <View style={styles.recommendedGrid}>
                    {RECOMMENDED_PRODUCTS.map((product) => (
                        <Pressable
                            key={product.id}
                            android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
                            style={({ pressed }) => [
                                styles.recommendedCard,
                                {
                                    backgroundColor: pressed ? Colors.pressed : Colors.lightgray,
                                    borderColor: pressed ? Colors.activeBorder : "transparent",
                                    opacity: pressed ? 0.9 : 1,
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                }
                            ]}
                            onPress={() => navigation.navigate("ProductDetails", { product })}
                        >
                            <ProductGraphic imageUri={product.image} bgColor={product.bgColor} large />
                            <View style={styles.recommendedInfo}>
                                <Text style={styles.recommendedName}>{product.name}</Text>
                                <Text style={styles.recommendedTabs}>{product.tabs}</Text>
                                <View style={styles.productFooter}>
                                    <Text style={styles.productPrice}>{product.price}</Text>
                                    <Pressable
                                        android_ripple={{ color: "rgba(255, 255, 255, 0.3)" }}
                                        style={({ pressed }) => [
                                            styles.addButton,
                                            pressed && { opacity: 0.8, transform: [{ scale: 0.9 }] }
                                        ]}
                                    >
                                        <Ionicons name="add" size={14} color={Colors.background} />
                                    </Pressable>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    scrollContent: {
        paddingBottom: 110,
        paddingHorizontal: 16,
    },
    uploadCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.pressed,
        borderRadius: 14,
        padding: 16,
        marginVertical: 12,
    },
    uploadIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    uploadTextContainer: {
        flex: 1,
    },
    uploadTitle: {
        fontSize: 16,
        fontFamily: "QuicksandBold",
        color: Colors.primary,
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontSize: 12,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        lineHeight: 16,
    },
    categoriesOuterCard: {
        backgroundColor: Colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 20,
    },
    categoriesSectionTitle: {
        fontSize: 18,
        fontFamily: "QuicksandBold",
        color: Colors.secondary,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    categoriesScroll: {
        paddingHorizontal: 4,
        gap: 14,
    },
    categoryCard: {
        width: 80,
        alignItems: "center",
    },
    categoryIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 8,
    },
    categoryImage: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
    },
    categoryLabel: {
        fontSize: 12,
        fontFamily: "QuicksandMedium",
        color: Colors.text,
        textAlign: "center",
        marginTop: 8,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    seeAllLink: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.secondary,
    },
    popularScroll: {
        gap: 12,
        paddingBottom: 16,
    },
    productCard: {
        width: 114,
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    graphicWrapper: {
        alignItems: "center",
        justifyContent: "center",
        height: 70,
        marginBottom: 8,
    },
    graphicWrapperLarge: {
        alignItems: "center",
        justifyContent: "center",
        height: 90,
        marginTop: 8,
    },
    productName: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        marginBottom: 2,
    },
    productTabs: {
        fontSize: 11,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        marginBottom: 8,
    },
    productFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    productPrice: {
        fontSize: 12,
        fontFamily: "QuicksandBold",
        color: Colors.primary,
    },
    addButton: {
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    recommendedGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    recommendedCard: {
        flex: 1,
        backgroundColor: Colors.lightgray,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "transparent",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    recommendedInfo: {
        marginTop: 10,
    },
    recommendedName: {
        fontSize: 15,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        marginBottom: 2,
    },
    recommendedTabs: {
        fontSize: 12,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
        marginBottom: 8,
    },
    imageCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    medicineImage: {
        width: "100%",
        height: "100%",
    },
    imageCircleLarge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    medicineImageLarge: {
        width: "100%",
        height: "100%",
    },
});
