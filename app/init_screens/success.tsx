import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import confettiParticles from "../json_dummy_datas/confettiParticles";
import { Colors } from "../config/colors";

export default function SuccessScreen() {
  const router = useRouter();
  const { height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenHeight < 720;
  const isTinyScreen = screenHeight < 600;

  const handleGoToHome = () => {
    router.replace("/tab_bar_home/HomeScreen");
  };



  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: isTinyScreen ? 20 : (isSmallScreen ? 40 : 80) }]}>

        {/* Confetti & Checkmark Area */}
        <View style={[
          styles.illustrationContainer,
          {
            width: isTinyScreen ? 180 : (isSmallScreen ? 220 : 280),
            height: isTinyScreen ? 180 : (isSmallScreen ? 220 : 280),
            marginVertical: isTinyScreen ? 5 : (isSmallScreen ? 15 : 40),
          }
        ]}>
          <View style={{
            position: "absolute",
            width: 280,
            height: 280,
            transform: [{ scale: isTinyScreen ? 0.6 : (isSmallScreen ? 0.8 : 1) }],
            justifyContent: "center",
            alignItems: "center",
          }}>
            {confettiParticles.map((particle) => (
              <View
                key={particle.id}
                style={[
                  styles.confetti,
                  {
                    width: particle.size,
                    height: particle.size,
                    top: particle.top,
                    left: particle.left,
                    backgroundColor: particle.color,
                    transform: [{ rotate: particle.rotate }],
                  },
                ]}
              />
            ))}

            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>
          </View>
        </View>

        {/* Text Area */}
        <View style={[styles.textContainer, { marginTop: isTinyScreen ? 5 : (isSmallScreen ? 10 : 20) }]}>
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.subtitle}>
            Congratulations, your account has been created.
          </Text>
          <Text style={styles.subtitle}>
            You can start using the app
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Pinned Go to Home Button */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={handleGoToHome}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
  },
  illustrationContainer: {
    width: 280,
    height: 280,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 55,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confetti: {
    position: "absolute",
    borderRadius: 2,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "QuicksandBold",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: Colors.label,
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
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
  homeBtnText: {
    color: Colors.lightgray,
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
