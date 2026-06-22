import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ImageBackground,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import AssessmentListItem from "../../components/AssessmentListItem";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { spd_processId_config } from "../config/process_id";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASSESSMENT_API_URL, SPD_USER_ID } from "../config/config";
import { SiteConfig } from "../config/site_config";
import Svg, { Path } from 'react-native-svg';
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

interface AssessmentItem {
  id: string;
  title: string;
  assessment_image: string;
  userLastScore: string;
  finishedOn: string;
  description?: string;
}


const AssessmentHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const horizontalMargin = useResponsiveHorizontalMargin();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    const USER_ID = await AsyncStorage.getItem(SPD_USER_ID);
    setError(null);
    const API_REQUEST_BODY = {
      get_api_url: SiteConfig.on_mood9_API_URL + ASSESSMENT_API_URL,
      get_api_url_type: "path_parameters",
      get_api_url_params: {
        getAllAssessments: USER_ID,
      },
    };
    try {
      const response = await callSuggestusAPI(
        spd_processId_config.sgconf_integration_getAPICallJWT,
        API_REQUEST_BODY
      );
      if (
        response?.returnCode === true &&
        Array.isArray(response.returnData)
      ) {
        let assessmentData = response.returnData;
        if (!!assessmentData) {
          assessmentData = assessmentData[0].p_return_result.data;
        }
        setAssessments(assessmentData);
      } else {
        setError(response?.msg || "Failed to fetch assessments.");
      }
    } catch (err: any) {
      setError(err?.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAssessments();
    }, [fetchAssessments])
  );

  useEffect(() => {
      
    fetchAssessments();
  }, [fetchAssessments]);

  const handlePress = (item: AssessmentItem) => {
    // router.push({
    //   pathname: '/assessments/AssessmentDetailScreen',
    //   params: { assessment: JSON.stringify(item) },
    // });
    navigation.navigate("assessments/AssessmentDetailScreen", {
      assessment: JSON.stringify(item),
    });
  };

  const mainContent = (
       <View
               style={[
                 styles.containerNew,
                 { marginLeft: horizontalMargin, marginRight: horizontalMargin },
               ]}>
  <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <CustomTopHeader title="Back" />
      <SafeAreaView style={[styles.safeArea,
                    Platform.OS === "web" && screenWidth >= 1024 ? { paddingHorizontal:116 } : null]}>
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#8A4FFF" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={assessments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AssessmentListItem
                  title={item.title}
                  lastScore={item.userLastScore}
                  date={item.finishedOn}
                  image={item.assessment_image}
                  onPress={() => handlePress(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
       </View>
  );
   if (Platform.OS === "web" && screenWidth >= 1024) {
      return (
        <ImageBackground
          source={require("../../assets/images/background_new_web.png")}
          style={{ flex: 1, width: "100%", height: "100%" }}
          resizeMode="cover"
        >
          {mainContent}
        </ImageBackground>
      );
    }
    return mainContent;
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
  },
  containerNew: { flex: 1 },
  headerRow: {    
    flexDirection: "row",
    alignItems: "center",
    marginTop:24,
    marginBottom:20,
    zIndex: 2,
    width:'100%',
    paddingVertical: 16 , borderBottomWidth:1, borderColor:'#ddd'
  },
    backBtn: {
    padding: 0,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 18,
    color: '#262626',
    marginLeft: 8,
    fontFamily: 'QuicksandSemiBold',
    width:'100%',
    textAlign:'center'
  },
  safeArea: {
    flex: 1,
    // backgroundColor: '#F6F8FC',
  },
  container: {
    flex: 1,
    // backgroundColor: '#F6F8FC',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#898d9e80",
    paddingTop: 10,
    paddingBottom: 12,
    color: "#262626",
    marginBottom: 18,
    marginLeft: 2,
    letterSpacing: 0.1,
    fontFamily: "QuicksandRegular",
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 12,
  },
});

export default AssessmentHomeScreen;
