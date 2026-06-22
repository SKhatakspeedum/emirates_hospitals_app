import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import CustomTopHeader from "../(drawer)/tab_bar_home/CustomTopHeader";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { spd_processId_config } from "../config/process_id";
import { SiteConfig } from "../config/site_config";
import { BLOGS_SUB_URL } from "../config/config";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

import { useNavigation } from "@react-navigation/native";
import useResponsiveHorizontalMargin from "../hooks/useResponsiveHorizontalMargin";

// tagOptions will be dynamic

const LearnScreen = () => {
  // categoryOptions is now array of { id, name }
  const [categoryOptions, setCategoryOptions] = useState<
    { id: string; name: string }[]
  >([{ id: "", name: "All" }]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  // ...other state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const horizontalMargin = useResponsiveHorizontalMargin();

  // Responsive background for web >= 1024
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.innerWidth
        : 0
      : 0,
  );

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateScreenWidth = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", updateScreenWidth);
    return () => window.removeEventListener("resize", updateScreenWidth);
  }, []);

  // Clear all tags
  const clearTags = () => {
    setPendingTags([]);
    setSelectedTags([]);
  };

  // Handle Apply Filter
  const handleFilterApply = () => {
    setSelectedCategory(pendingCategory);
    setSelectedTags(pendingTags);

    // Reset filter if 'All' and no tags
    if (
      (pendingCategory.id === "" || pendingCategory.name === "All") &&
      pendingTags.length === 0
    ) {
      setBlogs(allBlogs);
      setFilterModalVisible(false);
      return;
    }

    // Otherwise, filter from allBlogs
    const filtered = allBlogs.filter((item) => {
      if (
        pendingCategory.id !== "" &&
        pendingCategory.name !== "All" &&
        item.blog_category_id?.toString() !== pendingCategory.id
      )
        return false;
      if (pendingTags.length > 0) {
        let blogTags: string[] = [];
        if (Array.isArray(item.tags)) {
          blogTags = item.tags;
        } else if (typeof item.tags === "string") {
          blogTags = item.tags.split(",").map((t: string) => t.trim());
        }
        if (!blogTags.some((t) => pendingTags.includes(t))) {
          return false;
        }
      }
      return true;
    });

    setBlogs(filtered);
    setFilterModalVisible(false);
  };

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });
  const pickerBtnRef = React.useRef<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Sync pendingTags and pendingCategory with selected values when modal opens
  useEffect(() => {
    if (filterModalVisible) {
      setPendingTags(selectedTags);
      setPendingCategory(selectedCategory);
    }
  }, [filterModalVisible]);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  }>({ id: "", name: "All" });
  const [selectedType, setSelectedType] = useState<string>("All");
  const [pendingCategory, setPendingCategory] = useState<{
    id: string;
    name: string;
  }>({ id: "", name: "All" });

  // Sync pendingCategory with selectedCategory when modal opens
  useEffect(() => {
    if (filterModalVisible) {
      setPendingCategory(selectedCategory);
    }
  }, [filterModalVisible, selectedCategory]);

  // Fetch categories on mount
  useEffect(() => {
    callSuggestusAPI(
      spd_processId_config.spdonmood9_md_blog_categories_all_active,
      {},
    ).then((response) => {
      if (response?.returnCode && Array.isArray(response.returnData)) {
        // Each category should have id and name
        const cats = response.returnData
          .map((cat: any) => ({
            id:
              cat.id?.toString() ||
              cat.category_id?.toString() ||
              cat.blog_category_id?.toString() ||
              cat.value?.toString() ||
              "",
            name: cat.category || cat.name || cat.title || "",
          }))
          .filter((cat: { id: string; name: string }) => cat.name && cat.id);
        setCategoryOptions([{ id: "", name: "All" }, ...cats]);
      }
    });
  }, []);

  const showDropdown = () => {
    if (pickerBtnRef.current) {
      pickerBtnRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          setDropdownPos({ top: y + height, left: x, width });
          setShowCategoryDropdown(true);
        },
      );
    }
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    callSuggestusAPI(
      spd_processId_config.spdonmood9_get_md_blogs_category_wise,
      {},
    )
      .then((response) => {
        if (response?.returnCode && Array.isArray(response.returnData)) {
          const all: any[] = [];
          response.returnData.forEach((it: any) => {
            if (it.blogs) {
              try {
                const parsed = JSON.parse(it.blogs);
                if (Array.isArray(parsed)) all.push(...parsed);
              } catch {}
            }
          });
          setAllBlogs(all);
          setBlogs(all);
          // Extract unique tags from all blogs
          const tagSet = new Set<string>();
          all.forEach((blog: any) => {
            let tags = blog.tags;
            if (Array.isArray(tags)) {
              tags.forEach((t: any) => typeof t === "string" && tagSet.add(t));
            } else if (typeof tags === "string") {
              tags
                .split(",")
                .map((t) => t.trim())
                .forEach((t) => t && tagSet.add(t));
            }
          });
          setTagOptions(Array.from(tagSet));
        } else {
          setBlogs([]);
          setTagOptions([]);
        }
      })
      .catch(() => {
        setError("Failed to load blogs");
        setTagOptions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Only filter after debounce and filters
  const filteredBlogs = blogs.filter((item) => {
    // Search by title
    if (
      debouncedSearch.trim() &&
      !item.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) {
      return false;
    }
    // Category filter
    if (
      selectedCategory &&
      selectedCategory.id &&
      item.blog_category_id?.toString() !== selectedCategory.id
    ) {
      return false;
    }
    // Tags filter (at least one tag matches)
    if (selectedTags.length > 0) {
      let blogTags: string[] = [];
      if (Array.isArray(item.tags)) {
        blogTags = item.tags;
      } else if (typeof item.tags === "string") {
        blogTags = item.tags.split(",").map((t: string) => t.trim());
      }
      if (!blogTags.some((t) => selectedTags.includes(t))) {
        return false;
      }
    }
    return true;
  });

  const onCardPressBlogs = (item: any) => {
    let image = item.blog_media?.[0]?.media_file;
    if (image && !image.startsWith("http")) {
      image = SiteConfig.on_mood9_ASSETS_URL + BLOGS_SUB_URL + image;
    }
    navigation.navigate("blogs/BlogsScreen", {
      title: item.title,
      image,
      html_content: item.read_more_descr,
      author: item.author,
    });
  };

  const renderCard = ({ item }: any) => {
    let imageUri = item.blog_media?.[0]?.media_file;
    if (imageUri && !imageUri.startsWith("http")) {
      imageUri = SiteConfig.on_mood9_ASSETS_URL + BLOGS_SUB_URL + imageUri;
    }
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onCardPressBlogs(item)}
        style={{ paddingHorizontal: 16 }}
      >
        <View
          style={[
            styles.card,
            Platform.OS === "web" && screenWidth >= 1024
              ? { maxWidth: 1000, marginLeft: "auto", marginRight: "auto" }
              : {},
          ]}
        >
          <ImageBackground
            source={{ uri: imageUri || undefined }}
            style={[
              styles.cardImage,
              Platform.OS === "web" && screenWidth >= 1024
                ? { width: 800, height: 400 }
                : {},
            ]}
            imageStyle={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
            resizeMode="cover"
          >
            {/* Overlay for title if needed */}
          </ImageBackground>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardSubtitleRow}>
              <View style={styles.authorRow}>
                <>
                  {screenWidth < 1024 && (
                    <Svg width={11} height={14} viewBox="0 0 11 14" fill="none">
                      <Path
                        d="M5.41686 6.95046C6.28938 6.95046 7.04492 6.63753 7.66225 6.0201C8.27957 5.40277 8.59251 4.64744 8.59251 3.77481C8.59251 2.90249 8.27957 2.14705 7.66215 1.52953C7.04472 0.912303 6.28928 0.599365 5.41686 0.599365C4.54424 0.599365 3.7889 0.912303 3.17157 1.52963C2.55425 2.14695 2.24121 2.90239 2.24121 3.77481C2.24121 4.64744 2.55425 5.40287 3.17168 6.0202C3.7891 6.63742 4.54454 6.95046 5.41686 6.95046Z"
                        fill="#8B4CFC"
                      />
                      <Path
                        d="M10.9733 10.7378C10.9555 10.4809 10.9195 10.2006 10.8665 9.90469C10.813 9.60653 10.7441 9.32468 10.6616 9.06707C10.5764 8.8008 10.4605 8.53786 10.3173 8.28588C10.1686 8.02434 9.99399 7.7966 9.79804 7.6092C9.59314 7.41315 9.34226 7.25553 9.05216 7.14055C8.76306 7.02618 8.44268 6.96824 8.09997 6.96824C7.96538 6.96824 7.83521 7.02346 7.58384 7.18713C7.42913 7.28802 7.24817 7.4047 7.04618 7.53376C6.87347 7.64381 6.63949 7.74691 6.35049 7.84026C6.06854 7.9315 5.78226 7.97777 5.4997 7.97777C5.21714 7.97777 4.93096 7.9315 4.6487 7.84026C4.36 7.74701 4.12603 7.64391 3.95352 7.53386C3.75344 7.40601 3.57238 7.28933 3.41536 7.18703C3.16428 7.02336 3.03402 6.96814 2.89943 6.96814C2.55661 6.96814 2.23633 7.02618 1.94734 7.14065C1.65743 7.25543 1.40646 7.41305 1.20136 7.60931C1.0055 7.79681 0.830779 8.02444 0.682307 8.28588C0.539166 8.53786 0.423286 8.8007 0.337985 9.06717C0.255601 9.32478 0.186696 9.60653 0.133182 9.90469C0.0801708 10.2002 0.0441593 10.4806 0.0263548 10.7381C0.00885199 10.9904 0 11.2522 0 11.5167C0 12.2049 0.218785 12.7621 0.650219 13.173C1.07632 13.5785 1.64013 13.7842 2.32576 13.7842H8.67424C9.35987 13.7842 9.92348 13.5786 10.3497 13.173C10.7812 12.7624 11 12.2051 11 11.5166C10.9999 11.2509 10.9909 10.9889 10.9733 10.7378Z"
                        fill="#8B4CFC"
                      />
                    </Svg>
                  )}
                </>
                {Platform.OS === "web" && screenWidth >= 1024 ? (
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <Svg
                        width={11}
                        height={14}
                        viewBox="0 0 11 14"
                        fill="none"
                      >
                        <Path
                          d="M5.41686 6.95046C6.28938 6.95046 7.04492 6.63753 7.66225 6.0201C8.27957 5.40277 8.59251 4.64744 8.59251 3.77481C8.59251 2.90249 8.27957 2.14705 7.66215 1.52953C7.04472 0.912303 6.28928 0.599365 5.41686 0.599365C4.54424 0.599365 3.7889 0.912303 3.17157 1.52963C2.55425 2.14695 2.24121 2.90239 2.24121 3.77481C2.24121 4.64744 2.55425 5.40287 3.17168 6.0202C3.7891 6.63742 4.54454 6.95046 5.41686 6.95046Z"
                          fill="#8B4CFC"
                        />
                        <Path
                          d="M10.9733 10.7378C10.9555 10.4809 10.9195 10.2006 10.8665 9.90469C10.813 9.60653 10.7441 9.32468 10.6616 9.06707C10.5764 8.8008 10.4605 8.53786 10.3173 8.28588C10.1686 8.02434 9.99399 7.7966 9.79804 7.6092C9.59314 7.41315 9.34226 7.25553 9.05216 7.14055C8.76306 7.02618 8.44268 6.96824 8.09997 6.96824C7.96538 6.96824 7.83521 7.02346 7.58384 7.18713C7.42913 7.28802 7.24817 7.4047 7.04618 7.53376C6.87347 7.64381 6.63949 7.74691 6.35049 7.84026C6.06854 7.9315 5.78226 7.97777 5.4997 7.97777C5.21714 7.97777 4.93096 7.9315 4.6487 7.84026C4.36 7.74701 4.12603 7.64391 3.95352 7.53386C3.75344 7.40601 3.57238 7.28933 3.41536 7.18703C3.16428 7.02336 3.03402 6.96814 2.89943 6.96814C2.55661 6.96814 2.23633 7.02618 1.94734 7.14065C1.65743 7.25543 1.40646 7.41305 1.20136 7.60931C1.0055 7.79681 0.830779 8.02444 0.682307 8.28588C0.539166 8.53786 0.423286 8.8007 0.337985 9.06717C0.255601 9.32478 0.186696 9.60653 0.133182 9.90469C0.0801708 10.2002 0.0441593 10.4806 0.0263548 10.7381C0.00885199 10.9904 0 11.2522 0 11.5167C0 12.2049 0.218785 12.7621 0.650219 13.173C1.07632 13.5785 1.64013 13.7842 2.32576 13.7842H8.67424C9.35987 13.7842 9.92348 13.5786 10.3497 13.173C10.7812 12.7624 11 12.2051 11 11.5166C10.9999 11.2509 10.9909 10.9889 10.9733 10.7378Z"
                          fill="#8B4CFC"
                        />
                      </Svg>
                      <Text style={[styles.authorText, { marginLeft: 6 }]}>
                        {item.author || item.created_by || ""}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: "#555",
                        fontSize: 15,
                        marginTop: 2,
                        marginBottom: 2,
                        lineHeight: 20,
                        width: 700,
                        overflow: "hidden",
                      }}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.descr || ""}
                    </Text>
                    <Text style={[styles.readMore, { marginTop: 6 }]}>
                      Read more...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.authorText}>
                      {item.author || item.created_by || ""}
                    </Text>
                  </>
                )}
              </View>
              {screenWidth < 1024 && (
                <Text style={styles.readMore}>Read more...</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const mainContent = (
    <View
      style={[
        styles.containerNew,
        { marginLeft: horizontalMargin, marginRight: horizontalMargin },
      ]}
    >
      <ImageBackground
        source={require("@/assets/images/music_bg.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.topBarBack}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => navigation.goBack()}
          >
            <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
              <Path
                d="M7 1L2.41421 5.58579C1.63317 6.36683 1.63316 7.63316 2.41421 8.41421L7 13"
                stroke="#8B4CFC"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "QuicksandSemiBold",
                marginLeft: 8,
                marginBottom: 3,
                color: "#8B4CFC",
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* <CustomTopHeader title="Back" /> */}

        {/* Top Bar */}
        <View
          style={[
            styles.topBar,
            Platform.OS === "web" && screenWidth >= 1024
              ? { marginLeft: 180, marginRight: 180 }
              : {},
          ]}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Svg
                width={17}
                height={16}
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Path
                  d="M16.4102 7.48071H0.632097C0.475721 7.48071 0.32575 7.53662 0.215175 7.63614C0.104601 7.73565 0.0424805 7.87063 0.0424805 8.01137C0.0424805 8.15211 0.104601 8.28708 0.215175 8.3866C0.32575 8.48611 0.475721 8.54202 0.632097 8.54202H16.4102C16.5666 8.54202 16.7166 8.48611 16.8272 8.3866C16.9377 8.28708 16.9999 8.15211 16.9999 8.01137C16.9999 7.87063 16.9377 7.73565 16.8272 7.63614C16.7166 7.53662 16.5666 7.48071 16.4102 7.48071Z"
                  fill={"white"}
                />
                <Path
                  d="M8.65114 3.23544H16.4105C16.5669 3.23544 16.7168 3.17953 16.8274 3.08002C16.938 2.9805 17.0001 2.84553 17.0001 2.70479C17.0001 2.56405 16.938 2.42908 16.8274 2.32956C16.7168 2.23004 16.5669 2.17413 16.4105 2.17413H8.65114C8.49476 2.17413 8.34479 2.23004 8.23422 2.32956C8.12364 2.42908 8.06152 2.56405 8.06152 2.70479C8.06152 2.84553 8.12364 2.9805 8.23422 3.08002C8.34479 3.17953 8.49476 3.23544 8.65114 3.23544Z"
                  fill={"white"}
                />
                <Path
                  d="M8.32775 12.7872H0.589617C0.433241 12.7872 0.283269 12.8431 0.172695 12.9426C0.0621201 13.0421 0 13.1771 0 13.3178C0 13.4586 0.0621201 13.5935 0.172695 13.6931C0.283269 13.7926 0.433241 13.8485 0.589617 13.8485H8.32775C8.48412 13.8485 8.63409 13.7926 8.74467 13.6931C8.85524 13.5935 8.91736 13.4586 8.91736 13.3178C8.91736 13.1771 8.85524 13.0421 8.74467 12.9426C8.63409 12.8431 8.48412 12.7872 8.32775 12.7872Z"
                  fill={"white"}
                />
                <Path
                  d="M16.396 12.7873H12.8418V11.5435C12.8418 11.4027 12.7797 11.2678 12.6691 11.1682C12.5586 11.0687 12.4086 11.0128 12.2522 11.0128C12.0958 11.0128 11.9459 11.0687 11.8353 11.1682C11.7247 11.2678 11.6626 11.4027 11.6626 11.5435V15.0925C11.6626 15.2332 11.7247 15.3682 11.8353 15.4677C11.9459 15.5672 12.0958 15.6231 12.2522 15.6231C12.4086 15.6231 12.5586 15.5672 12.6691 15.4677C12.7797 15.3682 12.8418 15.2332 12.8418 15.0925V13.8486H16.396C16.5524 13.8486 16.7024 13.7927 16.813 13.6932C16.9235 13.5937 16.9857 13.4587 16.9857 13.318C16.9857 13.1772 16.9235 13.0423 16.813 12.9428C16.7024 12.8432 16.5524 12.7873 16.396 12.7873Z"
                  fill={"white"}
                />
                <Path
                  d="M0.632097 3.26737H4.18631V4.49636C4.18631 4.6371 4.24843 4.77208 4.359 4.87159C4.46958 4.97111 4.61955 5.02702 4.77592 5.02702C4.9323 5.02702 5.08227 4.97111 5.19285 4.87159C5.30342 4.77208 5.36554 4.6371 5.36554 4.49636V0.977066C5.36554 0.836327 5.30342 0.701353 5.19285 0.601836C5.08227 0.502319 4.9323 0.446411 4.77592 0.446411C4.61955 0.446411 4.46958 0.502319 4.359 0.601836C4.24843 0.701353 4.18631 0.836327 4.18631 0.977066V2.20606H0.632097C0.475721 2.20606 0.32575 2.26197 0.215175 2.36149C0.104601 2.461 0.0424805 2.59598 0.0424805 2.73672C0.0424805 2.87745 0.104601 3.01243 0.215175 3.11194C0.32575 3.21146 0.475721 3.26737 0.632097 3.26737Z"
                  fill={"white"}
                />
              </Svg>
              <Text style={styles.filterBtnText}>Filters</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8B4CFC"
            style={{ marginTop: 40 }}
          />
        ) : error ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: "red" }}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBlogs}
            renderItem={renderCard}
            keyExtractor={(item, idx) =>
              item.id?.toString() || item.title + idx
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <Text
                style={{ textAlign: "center", marginTop: 40, color: "#888" }}
              >
                No blogs found.
              </Text>
            )}
          />
        )}

        {/* Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlayCentered}>
            <View style={styles.centeredModalBox}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  {/* <Text style={styles.closeBtnText}>×</Text> */}
                  <Svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                    <Path
                      d="M7.69099 6.5001L12.7529 1.4379C13.0824 1.10862 13.0824 0.576231 12.7529 0.246956C12.4237 -0.0823187 11.8913 -0.0823187 11.562 0.246956L6.49992 5.30915L1.43798 0.246956C1.10856 -0.0823187 0.576335 -0.0823187 0.247067 0.246956C-0.0823556 0.576231 -0.0823556 1.10862 0.247067 1.4379L5.30901 6.5001L0.247067 11.5623C-0.0823556 11.8916 -0.0823556 12.424 0.247067 12.7532C0.411161 12.9175 0.62692 13 0.842525 13C1.05813 13 1.27374 12.9175 1.43798 12.7532L6.49992 7.69104L11.562 12.7532C11.7263 12.9175 11.9419 13 12.1575 13C12.3731 13 12.5887 12.9175 12.7529 12.7532C13.0824 12.424 13.0824 11.8916 12.7529 11.5623L7.69099 6.5001Z"
                      fill="#262626"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 14 }}
              >
                {/* Type of Content */}
                {/* <Text style={styles.sectionLabel}>Type of Content</Text>
              <View style={styles.toggleGroupRow}>
                {["All", "Media", "Articles"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.toggleBtn,
                      selectedType === type && styles.toggleBtnActive,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        selectedType === type && styles.toggleBtnTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View> */}

                {/* Categories */}
                <Text style={styles.sectionLabel}>Categories</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={showDropdown}
                  ref={pickerBtnRef}
                >
                  <Text style={styles.dropdownBtnText}>
                    {pendingCategory.name}
                  </Text>
                  <Svg width={15} height={8} viewBox="0 0 15 8" fill="none">
                    <Path
                      d="M1 1L6.14344 5.74779C6.90956 6.45498 8.09044 6.45498 8.85656 5.74779L14 1"
                      stroke="#8B4CFC"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                  {/* <Text style={styles.dropdownArrow}>▼</Text> */}
                </TouchableOpacity>

                {showCategoryDropdown && (
                  <View style={{ position: "relative", zIndex: 100 }}>
                    {/* Overlay to close dropdown on outside press */}
                    <Pressable
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99,
                        backgroundColor: "transparent",
                      }}
                      onPress={() => setShowCategoryDropdown(false)}
                    />
                    <View
                      style={[
                        styles.dropdownMenu,
                        {
                          position: "absolute",
                          top: 0, // directly below the button
                          left: 0,
                          width: "100%",
                          zIndex: 100,
                        },
                      ]}
                    >
                      {categoryOptions.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.dropdownItem,
                            pendingCategory.id === cat.id &&
                              styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setPendingCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              pendingCategory.id === cat.id && {
                                color: "#8B4CFC",
                                fontWeight: "bold",
                              },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tags */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 18,
                    marginBottom: 10,
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                    Tags
                  </Text>
                  <Text style={styles.clearTagsText} onPress={clearTags}>
                    Clear
                  </Text>
                </View>
                <View
                  style={[styles.toggleGroup, { flexWrap: "wrap", gap: 10 }]}
                >
                  {tagOptions.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.toggleBtn,
                        pendingTags.includes(tag) && styles.toggleBtnActive,
                      ]}
                      onPress={() =>
                        setPendingTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag],
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          pendingTags.includes(tag) &&
                            styles.toggleBtnTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Apply Button */}
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleFilterApply}
                >
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  containerNew: { flex: 1 },
  topBarBack: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
    marginLeft: 0,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    height: Platform.OS === "ios" ? 75 : 80,
    paddingVertical: 0,
    borderColor: "#ddd",
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center",
    alignItems: "center",
  },
  centeredModalBox: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
  },
  closeBtnText: {
    fontSize: 28,
    color: "#8B4CFC",
    fontWeight: "bold",
    marginLeft: 6,
    marginTop: -6,
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginBottom: 18,
  },
  toggleGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#898D9E",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 0,
    marginTop: 4,
    // backgroundColor: "#FAF8FF",
    justifyContent: "space-between",
  },
  dropdownBtnText: {
    fontSize: 14,
    color: "#262626",
    flex: 1,
  },
  dropdownArrow: {
    color: "#8B4CFC",
    fontSize: 18,
    marginLeft: 8,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    backgroundColor: "#fff",
    // paddingTop: 18,
    paddingHorizontal: 0,
    height: "100%",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  filterModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  closeBtn: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },

  sectionSpacing: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "QuicksandSemiBold",
    color: "#262626",
    marginBottom: 10,
  },
  toggleGroup: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: "#898D9E",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    flexGrow: 1,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  toggleBtnActive: {
    borderColor: "#8B4CFC",
    backgroundColor: "#ede6fc",
  },
  toggleBtnText: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    fontFamily: "QuicksandMedium",
  },
  toggleBtnTextActive: {
    color: "#8B4CFC",
    fontFamily: "QuicksandSemiBold",
  },
  pickerBtn: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: "#f6f4fd",
    minWidth: 120,
  },
  pickerBtnText: {
    fontSize: 15,
    color: "#444",
    fontFamily: "QuicksandMedium",
  },
  dropdownOverlay: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
    position: "absolute",
    left: 0,
    right: 0,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  dropdownItemActive: {
    backgroundColor: "#F1E7FF",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#444",
    fontFamily: "QuicksandMedium",
  },
  tagsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clearTagsText: {
    color: "#8B4CFC",
    textDecorationLine: "underline",
    fontSize: 14,
    fontFamily: "QuicksandMedium",
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#ddd",
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f6f4fd",
  },
  tagPillActive: {
    backgroundColor: "#8B4CFC",
    borderColor: "#8B4CFC",
  },
  tagPillText: {
    fontSize: 14,
    color: "#444",
    fontFamily: "QuicksandMedium",
  },
  tagPillTextActive: {
    color: "#fff",
    fontFamily: "QuicksandSemiBold",
  },
  applyBtn: {
    backgroundColor: "#8B4CFC",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 0,
    shadowColor: "#8B4CFC",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    letterSpacing: 0.3,
  },
  authorText: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
    marginLeft: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e3d7ff",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
    fontFamily: "QuicksandMedium",
    ...(Platform.OS === "web" ? { outlineStyle: "none", outlineWidth: 0 } : {}),
  },
  filterBtn: {
    borderRadius: 8,
    backgroundColor: "#8B4CFC",
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  filterBtnText: {
    color: "#fff",
    fontSize: 14,
    letterSpacing: 0.2,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
    marginBottom: 2,
    gap: 6,
    fontFamily: "QuicksandRegular",
  },
  listContainer: {
    paddingBottom: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#7f6aff33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: screenWidth * 0.38,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardContent: {
    paddingVertical: 14,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: "#262626",
    marginBottom: 8,
    fontFamily: "QuicksandSemiBold",
  },
  cardSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardAuthorIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
    tintColor: "#8B4CFC",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#262626",
    fontFamily: "QuicksandMedium",
  },
  readMore: {
    fontSize: 12,
    color: "#8B4CFC",
    textAlign: "right",
    fontFamily: "QuicksandMedium",
    textDecorationLine: "underline",
  },
});

export default LearnScreen;
