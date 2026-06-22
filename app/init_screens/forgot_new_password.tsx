import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { FontFamilies } from "../config/fonts";
import { Colors } from "../config/colors";
import { Labels } from "../config/labels";
import { MaterialIcons } from "@expo/vector-icons";

export default function ForgotNewPasswordScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  // Simple validation (expand as needed)
  const isFormFilled = fullName && email && password && confirmPassword;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/splash_icon.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>OnMood9</Text>
      </View>
      <Text style={styles.signupTitle}>Enter your new Password</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View
          style={[
            styles.inputWrapper,
            focusedField === "password" && styles.inputWrapperFocused,
          ]}
        >
          <Image
            source={require("@/assets/images/lock.png")}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.inputNoOutline]}
            placeholder="Password"
            placeholderTextColor="#B3B7C6"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField("")}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#B3B7C6"
            />
            {/* <Image source={require('@/assets/images/Hide-Password.png')} style={{ width: 20, height: 20, tintColor: '#B3B7C6' }} /> */}
          </TouchableOpacity>
        </View>
        <Text style={styles.inputLabel}>Confirm password</Text>
        <View
          style={[
            styles.inputWrapper,
            focusedField === "confirmPassword" && styles.inputWrapperFocused,
          ]}
        >
          <Image
            source={require("@/assets/images/lock.png")}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.inputNoOutline]}
            placeholder="Confirm password"
            placeholderTextColor="#B3B7C6"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField("")}
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#B3B7C6"
            />
            {/* <Image source={require('@/assets/images/Hide-Password.png')} style={{ width: 20, height: 20, tintColor: '#B3B7C6' }} /> */}
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.signupButton,
          isFormFilled
            ? styles.signupButtonActive
            : styles.signupButtonInactive,
        ]}
        disabled={!isFormFilled}
        activeOpacity={isFormFilled ? 0.7 : 1}
        onPress={() => {
          /* handle signup logic */
        }}
      >
        <Text style={styles.signupButtonText}>Create account</Text>
      </TouchableOpacity>
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require("@/assets/images/google.png")}
            style={styles.socialIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require("@/assets/images/fb.png")}
            style={styles.socialIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace("/init_screens/login")}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
    borderRadius: 32,
    backgroundColor: "#888CA0",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: "#B3B7C6",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    backgroundColor: "#fafaff",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputWrapperFocused: {
    borderColor: "#8C6FFF",
    backgroundColor: "#F0F6FF",
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  inputNoOutline: {
    outlineWidth: 0,
  },
  inputIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    alignSelf: "center",
    resizeMode: "contain",
    tintColor: Colors.text + "80",
  },
  eyeIcon: {
    padding: 4,
  },
  signupButton: {
    width: "100%",
    backgroundColor: "#888CA0",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  signupButtonActive: {
    backgroundColor: "#8C6FFF",
    shadowColor: "#8C6FFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  signupButtonInactive: {
    backgroundColor: "#888CA0",
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  orText: {
    marginHorizontal: 8,
    color: "#888",
    fontWeight: "bold",
  },
  socialContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: "#fafaff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  loginText: {
    color: "#888",
    fontSize: 14,
  },
  loginLink: {
    color: "#8C6FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  signupTitle: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
});
