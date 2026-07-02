import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { FontFamilies } from '../config/fonts';

interface CustomHeaderProps {
  title: string;
  onBackPress?: () => void;
}

export default function CustomHeader({ title, onBackPress }: CustomHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} style={styles.backIcon} />
        <Text style={styles.headerTitle}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 12,
    marginVertical: 15,
    backgroundColor: Colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: FontFamilies.bold,
  },
});
