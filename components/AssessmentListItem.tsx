import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { format } from "date-fns";

interface AssessmentListItemProps {
  title: string;
  lastScore: string;
  date: string;
  image: any;
  onPress: () => void;
}

const formatDisplayDate = (inputDate: string | undefined | null): string => {
  if (!inputDate || inputDate === "--") return "--";
  const parsedDate = new Date(inputDate);
  if (isNaN(parsedDate.getTime())) return "--"; // invalid date handling
  return format(parsedDate, "d, MMM yyyy");
};

const AssessmentListItem: React.FC<AssessmentListItemProps> = ({
  title,
  lastScore,
  date,
  image,
  onPress,
}) => 
  
  (
  <TouchableOpacity
    style={styles.shadowWrap}
    activeOpacity={0.9}
    onPress={onPress}
  >
    <View style={styles.card}>
      <Image source={{uri:image}} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.textContainerInfo}>
          <Text style={styles.subtitle}>
            Last score <Text style={styles.subtitleLast}>{lastScore}</Text>
          </Text>
          {formatDisplayDate(date) !== "--" && (
            <Text style={styles.date}>
              as on{" "}
              <Text style={styles.dateLast}>{formatDisplayDate(date)}</Text>
            </Text>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // shadowWrap: {
  //   marginBottom: 0,
  //   backgroundColor: 'transparent', 
  //   borderRadius: 0,
  //   ...Platform.select({
  //     ios: {
  //       shadowColor: "#000",
  //       shadowOpacity: 0.08,
  //       shadowOffset: { width: 0, height: 2 },
  //       shadowRadius: 8,
  //     },
  //     android: {
  //       elevation: 4, 
  //     },
  //   }),
  // },
  
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0", // lighter for contrast
    padding: 15, // more breathing room
    paddingHorizontal:0,
    borderRadius: 0,
  },
  
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#EEE",
  },
  
  title: {
    fontSize: 16,
    fontFamily: "QuicksandSemiBold",
    color: "#232323",
    marginBottom: 6,
    fontFamily: Platform.OS === "android" ? "sans-serif" : "QuicksandSemiBold",
  },
  
  subtitle: {
    fontSize: 14,
    fontFamily: "QuicksandMedium",
    color: "#666",
  },
  
  subtitleLast: {
    color: "#000",
    fontFamily: "QuicksandMedium",
  },
  
  textContainerInfo: {
    flexDirection: "row",
    flexWrap: "wrap", // fixes overflow
    justifyContent: "space-between",
  },
  
  date: {
    fontSize: 14,
    color: "#666",
    fontFamily: "QuicksandMedium",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
 
  dateLast: {
    fontFamily: "QuicksandMedium",
    color: "#262626",
  },
});

export default AssessmentListItem;
