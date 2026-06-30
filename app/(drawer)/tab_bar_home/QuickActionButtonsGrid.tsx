import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const ACTIONS = [
  {
    label: "De-stress",
    screen: "DistressMeditate",
    params: { category_code: "DE_STRESS" },
    icon: <MaterialCommunityIcons name="spa" size={28} color="#7B61FF" />,
  },
  {
    label: "Meditate",
    screen: "DistressMeditate",
    params: { category_code: "MINDFULNESS" },
    icon: (
      <MaterialCommunityIcons name="meditation" size={28} color="#7B61FF" />
    ),
  },
  {
    label: "Assessment",
    screen: "assessments/AssessmentHomeScreen",
    icon: <FontAwesome5 name="clipboard-list" size={26} color="#7B61FF" />,
  },
  {
    label: "Favorite",
    screen: "favorite/FavoriteList",
    icon: <MaterialCommunityIcons name="heart" size={28} color="#7B61FF" />,
  },
];

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export default function QuickActionButtonsGrid() {
  const navigation = useNavigation<any>();
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.innerWidth > 800 : false;
    } else {
      return Dimensions.get("window").width > 800;
    }
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleResize = () => {
        setIsLargeScreen(window.innerWidth > 800);
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      const subscription = Dimensions.addEventListener(
        "change",
        ({ window }) => {
          setIsLargeScreen(window.width > 800);
        },
      );
      return () => subscription?.remove();
    }
  }, []);

  let rows: any[][];
  let buttonStyle: any;
  let gridStyle: any;
  if (isLargeScreen) {
    // 1 row, 4 columns
    rows = [ACTIONS];
    buttonStyle = [
      styles.button,
      {
        width: "23%",
        marginBottom: 0,
        marginRight: 20,
        marginHorizontal: 0,
        flex: 1 as const,
      },
    ];
    gridStyle = [
      styles.grid,
      {
        flexDirection: "row" as const,
        flexWrap: "nowrap" as const,
        justifyContent: "space-between" as const,
      },
    ];
  } else {
    // 2 rows, 2 columns
    rows = chunkArray(ACTIONS, 2);
    buttonStyle = [styles.button, { width: "47%", marginBottom: 14 }];
    gridStyle = [
      styles.grid,
      {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        justifyContent: "space-between" as const,
      },
    ];
  }

  return (
    <View style={gridStyle}>
      {rows.map((row, rowIdx) =>
        row.map((action, colIdx) => (
          <TouchableOpacity
            onPress={() => {
              if (action.label === "De-stress" || action.label === "Meditate") {
                Toast.show({
                  type: "info",
                  text1: "Coming Soon",
                  text2: `${action.label} feature is coming soon. Stay tuned!`,
                  position: "top",
                });
              } else {
                navigation.navigate(action.screen, action.params);
              }
            }}
            key={action.label}
            style={buttonStyle}
          >
            <View style={styles.iconCircle}>
              {React.cloneElement(action.icon, { color: "#fff", size: 14 })}
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 0,
    marginBottom: 10,
    marginTop: 30,
  },
  button: {
    backgroundColor: "#e8dbfe",
    borderRadius: 10,
    width: "47%",
    marginBottom: 14,
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    backgroundColor: "#8B4CFC",
    borderRadius: 24,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  label: {
    color: "#222",
    fontFamily: "QuicksandSemiBold",
    fontSize: 16,
    marginTop: 0,
  },
});
