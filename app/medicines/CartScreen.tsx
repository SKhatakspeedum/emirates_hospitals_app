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
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Colors } from "../config/colors";
import CustomHeader from "../components/CustomHeader";

const { width } = Dimensions.get("window");

export default function CartScreen() {
    const navigation = useNavigation<any>();

    // Dynamic states for cart item quantities
    const [qtyCalvit, setQtyCalvit] = useState(2);
    const [qtyRelibond, setQtyRelibond] = useState(1);

    const priceCalvit = 5.80;
    const priceRelibond = 80.60;
    const deliveryCharge = 10.00;

    const subtotal = (qtyCalvit * priceCalvit) + (qtyRelibond * priceRelibond);
    const total = subtotal > 0 ? subtotal + deliveryCharge : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <CustomHeader title="Catalogue" onBackPress={() => navigation.goBack()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Cart Items List */}
                <View style={styles.itemsContainer}>
                    {/* Item 1: Calvit-L */}
                    {qtyCalvit > 0 && (
                        <View style={styles.cartItem}>
                            <View style={styles.itemImageWrapper}>
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=150" }}
                                    style={styles.itemImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>Calvit-L</Text>
                                <Text style={styles.itemPrice}>AED {priceCalvit.toFixed(2)}</Text>
                            </View>
                            <View style={styles.quantityControl}>
                                <TouchableOpacity
                                    style={styles.quantityBtn}
                                    onPress={() => setQtyCalvit(Math.max(0, qtyCalvit - 1))}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="minus" size={14} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{qtyCalvit}</Text>
                                <TouchableOpacity
                                    style={styles.quantityBtn}
                                    onPress={() => setQtyCalvit(qtyCalvit + 1)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="plus" size={14} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Item 2: Relibond */}
                    {qtyRelibond > 0 && (
                        <View style={styles.cartItem}>
                            <View style={styles.itemImageWrapper}>
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150" }}
                                    style={styles.itemImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>Relibond</Text>
                                <Text style={styles.itemPrice}>AED {priceRelibond.toFixed(2)}</Text>
                            </View>
                            <View style={styles.quantityControl}>
                                <TouchableOpacity
                                    style={styles.quantityBtn}
                                    onPress={() => setQtyRelibond(Math.max(0, qtyRelibond - 1))}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="minus" size={14} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{qtyRelibond}</Text>
                                <TouchableOpacity
                                    style={styles.quantityBtn}
                                    onPress={() => setQtyRelibond(qtyRelibond + 1)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="plus" size={14} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {qtyCalvit === 0 && qtyRelibond === 0 && (
                        <View style={styles.emptyContainer}>
                            <Feather name="shopping-bag" size={48} color={Colors.inactive} />
                            <Text style={styles.emptyText}>Your cart is empty</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Summary Card Box (Docked Sticky Panel) */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>AED {subtotal.toFixed(1)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text style={styles.summaryValue}>AED {subtotal > 0 ? deliveryCharge.toFixed(0) : "0"}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelBold}>Total</Text>
                    <Text style={styles.summaryValueBold}>AED {total.toFixed(1)}</Text>
                </View>

                {/* Proceed Button */}
                <TouchableOpacity
                    style={[
                        styles.proceedButton,
                        (qtyCalvit === 0 && qtyRelibond === 0) && { backgroundColor: Colors.inactive }
                    ]}
                    disabled={qtyCalvit === 0 && qtyRelibond === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.proceedText}>Proceed to checkout</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={styles.proceedIcon} />
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
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    itemsContainer: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    cartItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemImageWrapper: {
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontSize: 16,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.secondary,
    },
    quantityControl: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    quantityBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F4F8FC",
        alignItems: "center",
        justifyContent: "center",
    },
    quantityText: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.text,
        minWidth: 16,
        textAlign: "center",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
    },
    summaryCard: {
        backgroundColor: "#F4F8FC",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 78,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: "QuicksandMedium",
        color: Colors.label,
    },
    summaryValue: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    summaryLabelBold: {
        fontSize: 16,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    summaryValueBold: {
        fontSize: 16,
        fontFamily: "QuicksandBold",
        color: Colors.text,
    },
    proceedButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 10,
    },
    proceedText: {
        fontSize: 14,
        fontFamily: "QuicksandBold",
        color: "#FFFFFF",
        marginRight: 8,
    },
    proceedIcon: {
        marginTop: 1,
    },
});
