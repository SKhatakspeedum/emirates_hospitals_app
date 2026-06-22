import React, { useEffect, useState } from "react";
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { BLOGS_SUB_URL, COURSES_SUB_URL, SPD_USER_SUBSCRIPTION } from "../config/config";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const CARD_RADIUS = 16;
const CARD_HEIGHT = 190;
const SECTION_MARGIN = 12;

const ExploreScreen = () => {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [deStress, setDeStress] = useState([]);
  const [deStressLoading, setDeStressLoading] = useState(true);
  const [deStressError, setDeStressError] = useState<string | null>(null);
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [meditate, setMeditate] = useState([]);
  const [meditateLoading, setMeditateLoading] = useState(true);
  const [meditateError, setMeditateError] = useState<string | null>(null);

  useEffect(() => {
    setBlogsLoading(true);
    setBlogsError(null);
    callSuggestusAPI(
      spd_processId_config.spdonmood9_get_md_blogs_category_wise,
      {}
    )
      .then((response) => {
        if (response?.returnCode && Array.isArray(response.returnData)) {
          const all = [];
          response.returnData.forEach((it: any) => {
            if (it.blogs) {
              try {
                const parsed = JSON.parse(it.blogs);
                if (Array.isArray(parsed)) all.push(...parsed);
              } catch {}
            }
          });
          setBlogs(all);
        } else setBlogs([]);
      })
      .catch(() => setBlogsError("Failed to load blogs"))
      .finally(() => setBlogsLoading(false));
  }, []);

  useEffect(() => {
    setProgramsLoading(true);
    setProgramsError(null);
    callSuggestusAPI(
      spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
      { p_category_type_code: "MOODS" }
    )
      .then((response) => {
        if (response?.returnCode && Array.isArray(response.returnData))
          setPrograms(response.returnData);
        else setPrograms([]);
      })
      .catch(() => setProgramsError("Failed to load programs"))
      .finally(() => setProgramsLoading(false));
  }, []);

  useEffect(() => {
    setDeStressLoading(true);
    setDeStressError(null);
    callSuggestusAPI(
      spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
      { p_category_code: "DE_STRESS" }
    )
      .then((response) => {
        if (response?.returnCode && Array.isArray(response.returnData)) {
          let all: any[] = [];
          response.returnData.forEach((it: any) => {
            if (it.data_category_group_module) {
              try {
                const parsed = JSON.parse(it.data_category_group_module);
                if (Array.isArray(parsed)) all = all.concat(parsed);
              } catch {}
            }
          });
          // Add premium property based on is_paid
          all = all.map((item) => ({ ...item, premium: item.is_paid === 'paid' }));
          setDeStress(all);
        } else setDeStress([]);
      })
      .catch(() => setDeStressError("Failed to load de-stress"))
      .finally(() => setDeStressLoading(false));
  }, []);

  useEffect(() => {
    setMeditateLoading(true);
    setMeditateError(null);
    callSuggestusAPI(
      spd_processId_config.spdonmood9_get_md_category_group_module_category_wise_wrapper,
      { p_category_code: "MINDFULNESS" }
    )
      .then((response) => {
        if (response?.returnCode && Array.isArray(response.returnData)) {
          let all: any[] = [];
          response.returnData.forEach((it: any) => {
            if (it.data_category_group_module) {
              try {
                const parsed = JSON.parse(it.data_category_group_module);
                if (Array.isArray(parsed)) all = all.concat(parsed);
              } catch {}
            }
          });
          // Add premium property based on is_paid
          all = all.map((item) => ({ ...item, premium: item.is_paid === 'paid' }));
          setMeditate(all);
        } else setMeditate([]);
      })
      .catch(() => setMeditateError("Failed to load meditate"))
      .finally(() => setMeditateLoading(false));
  }, []);

  const onSeeAll = (section: string) => {
  let allPlans = [];
  let type = section;
  if (section === "program") {
    allPlans = programs;
    type = "program";
  } else if (section === "learn") {
    allPlans = blogs;
    type = "learn";
    navigation.navigate("learn/LearnScreen", { allPlans, type });
    return '';
  } else if (section === "de-stress") {
    allPlans = deStress;
    type = "de-stress";
  } else if (section === "meditate") {
    allPlans = meditate;
    type = "MINDFULNESS";
  }
  navigation.navigate("seeAll/SeeAllPlansScreen", { allPlans, type });
};
  const onCardPress = (item) => {
    navigation.navigate("explore_tab/ExploreDetailScreen", {
      itemData: item,
    });
  };

  const onAssessments = () =>
    navigation.navigate("assessments/AssessmentHomeScreen");

  const onCardPressBlogs = (item) =>
    navigation.navigate("blogs/BlogsScreen", {
      title: item.title,
      image: item.blog_media?.[0]?.media_file?.startsWith("http")
        ? item.blog_media[0].media_file
        : SiteConfig.on_mood9_ASSETS_URL +
          BLOGS_SUB_URL +
          item.blog_media[0].media_file,
      html_content: item.read_more_descr,
      author: item.author,
    });

    const onMeditatePress = async (item) => {
      let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
    if (item.premium && subscription_status === "false") {
      Toast.show({
        type: 'info',
        text1: 'You need to buy paid membership to view the content.'
      });
      return;
    }
    let s = item.session_json_data;
    if (typeof s === "string") s = JSON.parse(s);
    if (s?.length > 1)
      navigation.navigate("all_session/SeeAllSession", {
        sessions: s,
        moduleData: item,
      });
    else
      navigation.navigate("music_player/MusicPlayerScreen", {
        itemData: item,
        sessionData: s?.[0] || null,
      });
    };

  const onDeStressPress = async (item) => {
    let subscription_status = await AsyncStorage.getItem(SPD_USER_SUBSCRIPTION);
  if (item.premium && subscription_status === "false") {
    Toast.show({
      type: 'info',
      text1: 'You need to buy paid membership to view the content.'
    });
    return;
  }
  let s = item.session_json_data;
  if (typeof s === "string") s = JSON.parse(s);
  if (s?.length > 1)
    navigation.navigate("all_session/SeeAllSession", {
      sessions: s,
      moduleData: item,
    });
  else
    navigation.navigate("music_player/MusicPlayerScreen", {
      itemData: item,
      sessionData: s?.[0] || null,
    });
};

  const Card = ({ item, onPress }) => (
    <TouchableOpacity style={styles.outerLayer} onPress={onPress}>
      <View style={styles.middleLayer}>
        <View style={styles.cardContainer}>
          <ImageBackground
            style={styles.cardImageSec}
            source={{
              uri: item.media_value?.startsWith("http")
                ? item.media_value
                : SiteConfig.on_mood9_ASSETS_URL +
                  COURSES_SUB_URL +
                  item.media_value,
            }}
            imageStyle={{ borderRadius: 14 }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
              style={styles.cardOverlay}
            />
            
                         <View style={styles.imageOverlay}></View>
            <Text style={styles.cardText}>{item.name}</Text>
          </ImageBackground>
        </View>
      </View>
    </TouchableOpacity>
  );

  const CardDeStress = ({ item, onPress }) => (
    <TouchableOpacity
      style={[styles.card, { width: 140, height: 180 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <ImageBackground
        style={[styles.cardImageSec, { width: 140, height: 180 }]}
        source={{
          uri: item.module_image?.startsWith("http")
            ? item.module_image
            : SiteConfig.on_mood9_ASSETS_URL +
              COURSES_SUB_URL +
              item.module_image,
        }}
        imageStyle={{ borderRadius: 14 }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
          style={styles.cardOverlay}
        />
                         <View style={styles.imageOverlay}></View>
        <Text style={styles.cardText}>{item.module_name}</Text>
          {item.premium && (
                              <View style={styles.crownOverlay}>
            {/* <Image
              source={require("@/assets/images/crown.png")}
              style={styles.crownIcon}
            /> */}
            
                            <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
            </View>
          )}
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/internal_screen_bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* <Text style={styles.pageTitle}>Explore</Text>
        <View style={styles.divider} /> */}

        {/* Programs */}
        <SectionHeader title="Programs" onSeeAll={onSeeAll} sectionKey="program" />
        {programsLoading ? (
          <View style={styles.sectionContent}>
            <ActivityIndicator size="small" color="#8B4CFC" />
          </View>
        ) : programsError ? (
          <View style={styles.sectionContent}>
            <Text style={{ color: "red" }}>{programsError}</Text>
          </View>
        ) : (
          <FlatList
            data={programs.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => `${item.module_id || idx}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <Card item={item} onPress={() => onCardPress(item)} />
            )}
          />
        )}

        {/* Assessments Banner */}
        <View style={styles.bannerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerText}>
              Check your emotional wellbeing status
            </Text>
            <TouchableOpacity onPress={onAssessments}>
              <Text style={styles.bannerLink}>
                Assessments{" "}
                <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
                  <Path
                    d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
                    stroke="#8B4CFC"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                  />
                </Svg>
              </Text>
            </TouchableOpacity>
          </View>
          <ImageBackground
            source={require("@/assets/images/assess.png")}
            style={styles.bannerImage}
            imageStyle={{ borderRadius: 16 }}
          />
        </View>

        {/* De-Stress */}
        <SectionHeader title="De-Stress" onSeeAll={onSeeAll} sectionKey="de-stress" />
        {deStressLoading ? (
          <View style={styles.sectionContent}>
            <ActivityIndicator size="small" color="#8B4CFC" />
          </View>
        ) : deStressError ? (
          <View style={styles.sectionContent}>
            <Text style={{ color: "red" }}>{deStressError}</Text>
          </View>
        ) : (
          <FlatList
            data={deStress.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => `${item.module_id || idx}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CardDeStress item={item} onPress={() => onDeStressPress(item)} />
            )}
          />
        )}

        {/* meditate */}
        <SectionHeader title="Meditate" onSeeAll={onSeeAll} sectionKey="meditate" />
        {meditateLoading ? (
          <View style={styles.sectionContent}>
            <ActivityIndicator size="small" color="#8B4CFC" />
          </View>
        ) : meditateError ? (
          <View style={styles.sectionContent}>
            <Text style={{ color: "red" }}>{meditateError}</Text>
          </View>
        ) : (
          <FlatList
            data={meditate.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => `${item.module_id || idx}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CardDeStress item={item} onPress={() => onMeditatePress(item)} />
            )}
          />
        )}

        {/* Learn */}
        <SectionHeader title="Learn" onSeeAll={onSeeAll} sectionKey="learn" />
        {blogsLoading ? (
          <View style={styles.sectionContent}>
            <ActivityIndicator size="small" color="#8B4CFC" />
          </View>
        ) : blogsError ? (
          <View style={styles.sectionContent}>
            <Text style={{ color: "red" }}>{blogsError}</Text>
          </View>
        ) : blogs.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={{ color: "#999" }}>No blogs found.</Text>
          </View>
        ) : (
          <FlatList
            data={blogs.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => `${item.blog_id || idx}`}
            contentContainerStyle={[styles.horizontalList, { marginBottom: 40 }]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onCardPressBlogs(item)}
                activeOpacity={0.85}
              >
                <ImageBackground
                  style={styles.cardImageSec}
                  source={{
                    uri: item.blog_media?.[0]?.media_file?.startsWith("http")
                      ? item.blog_media[0].media_file
                      : SiteConfig.on_mood9_ASSETS_URL +
                        BLOGS_SUB_URL +
                        item.blog_media[0].media_file,
                  }}
                  imageStyle={{ borderRadius: 14 }}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
                    style={styles.cardOverlay}
                  />
                         <View style={styles.imageOverlay}></View>
                  <Text style={styles.cardText}>{item.title}</Text>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const SectionHeader = ({ title, onSeeAll, sectionKey }: any) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <Text
        style={styles.sleepPlansButton}
        onPress={() => onSeeAll(sectionKey)}
      >
        See all{" "}
        <Svg width={5} height={9} viewBox="0 0 5 9" fill="none">
          <Path
            d="M1 1L3.27983 2.99485C4.19048 3.79167 4.19048 5.20833 3.27982 6.00515L1 8"
            stroke="#8B4CFC"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </Svg>
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
    crownOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    zIndex: 2,
  },
  crownIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  outerLayer: {
    marginTop: 10,
    marginLeft: 10,
    marginRight: 15,
    backgroundColor: "#d9d9d9",
    borderRadius: 16,
    width: 180,
    height: CARD_HEIGHT,
    position: "relative",
    top: 6,
    left: 6,
  },
  middleLayer: {
    backgroundColor: "#bfbfbf",
    borderRadius: 16,
    width: 180,
    height: CARD_HEIGHT,
    position: "absolute",
    top: -6,
    left: -6,
  },
  sleepPlansButton: {
    color: "#8B4CFC",
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
  },
  cardContainer: {
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    width: 180,
    height: CARD_HEIGHT,
    position: "absolute",
    top: -6,
    left: -6,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 22,
  },
  background: { flex: 1, width: "100%", backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 25,
  },
  divider: { height: 1, backgroundColor: "#E6E6E6", marginVertical: 8 },
  pageTitle: {
    fontSize: 18,
    color: "#262626",
    marginLeft: 8,
    fontFamily: "QuicksandSemiBold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  horizontalList: { marginBottom: SECTION_MARGIN },
  card: {
    width: 180,
    height: CARD_HEIGHT,
    borderRadius: 14,
    marginRight: 15,
    overflow: "hidden",
  },
  cardImageSec: { width: "100%", height: "100%" },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    opacity: 0.5,
  },
  cardText: {
    color: "#fff",
    fontFamily: "QuicksandMedium",
    fontSize: 16,
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 4,
  },
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cdf0fb",
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#222B45",
    marginBottom: 8,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
  },
  bannerLink: { fontSize: 16, color: "#7D5FFF", fontFamily: "QuicksandBold", },
  bannerImage: { width: 70, height: 70, marginLeft: 12 },
  sectionContent: {
    height: CARD_HEIGHT + SECTION_MARGIN,
    marginBottom: SECTION_MARGIN,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ExploreScreen;
