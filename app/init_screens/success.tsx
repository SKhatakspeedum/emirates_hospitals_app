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
import confettiParticles from "../json_dummy_datas/confettiParticles";

export default function SuccessScreen() {
  const router = useRouter();

  const handleGoToHome = () => {
    router.replace("/tab_bar_home/HomeScreen");
  };



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
    marginVertical: 40,
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
