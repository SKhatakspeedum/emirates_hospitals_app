import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SuccessScreen() {
  const router = useRouter();

  const handleGoToHome = () => {
    router.replace("/tab_bar_home/HomeScreen");
  };

  // Custom confetti particles with positions, sizes, rotations and colors from the mockup
  const confettiParticles = [
    { id: 1, size: 7, top: 20, left: 60, color: "#A5A9C0", rotate: "15deg" },
    { id: 2, size: 5, top: 40, left: 180, color: "#8C90A6", rotate: "45deg" },
    { id: 3, size: 8, top: 60, left: 280, color: "#A5A9C0", rotate: "30deg" },
    { id: 4, size: 6, top: 80, left: 90, color: "#B8BACF", rotate: "12deg" },
    { id: 5, size: 9, top: 90, left: 200, color: "#A5A9C0", rotate: "60deg" },
    { id: 6, size: 4, top: 130, left: 200, color: "#D2D4E2", rotate: "25deg" },
    { id: 7, size: 7, top: 140, left: 50, color: "#8C90A6", rotate: "50deg" },
    { id: 8, size: 5, top: 170, left: 160, color: "#B8BACF", rotate: "80deg" },
    { id: 9, size: 8, top: 180, left: 80, color: "#A5A9C0", rotate: "35deg" },
    { id: 10, size: 6, top: 10, left: 220, color: "#8C90A6", rotate: "18deg" },
    { id: 11, size: 7, top: 20, left: 110, color: "#A5A9C0", rotate: "40deg" },
    { id: 12, size: 5, top: 225, left: 280, color: "#D2D4E2", rotate: "15deg" },
    { id: 13, size: 9, top: 240, left: 30, color: "#A5A9C0", rotate: "65deg" },
    { id: 14, size: 6, top: 250, left: 170, color: "#B8BACF", rotate: "22deg" },
    { id: 15, size: 8, top: 260, left: 170, color: "#8C90A6", rotate: "48deg" },
    { id: 16, size: 5, top: 280, left: 250, color: "#A5A9C0", rotate: "10deg" },
    { id: 17, size: 7, top: 290, left: 130, color: "#B8BACF", rotate: "75deg" },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* Confetti & Checkmark Area */}
        <View style={styles.illustrationContainer}>
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

        {/* Text Area */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.subtitle}>
            Congratulations, your account has been created.
          </Text>
          <Text style={styles.subtitle}>
            You can start using the app
          </Text>
        </View>

        <View style={{ flex: 0.2 }} />

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
    backgroundColor: "#fff",
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
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 55,
    backgroundColor: "#0076D6",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0076D6",
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
    color: "#1A1D24",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "QuicksandMedium",
    color: "#8E95A9",
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    width: "100%",
    backgroundColor: "#001871",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#001871",
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
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
  },
});
