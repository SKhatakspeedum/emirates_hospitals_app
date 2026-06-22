import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Extend props to accept toggleSheet
interface FooterProps extends BottomTabBarProps {
  toggleSheet?: () => void;
}

export default function Footer({ state, descriptors, navigation, toggleSheet }: FooterProps) {
  const rootNavigation = useNavigation();

  // Function to handle opening the drawer (if needed elsewhere)
  const openDrawer = () => {
    rootNavigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity 
        style={state.index === 0 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate('HomeTab')}
      >
      <Image
            source={require('@/assets/images/home.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: state.index === 0 ? "#7B61FF" : "#B3B7C6"
            }}
            resizeMode="contain"
          />
        <Text style={state.index === 0 ? styles.tabLabelActive : styles.tabLabel}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Sleep Tab */}
      <TouchableOpacity 
        style={state.index === 1 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate('SleepTab')}
      >
         <Image
            source={require('@/assets/images/sleep.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: state.index === 1 ? "#7B61FF" : "#B3B7C6"
            }}
            resizeMode="contain"
          />
        <Text style={state.index === 1 ? styles.tabLabelActive : styles.tabLabel}>
          Sleep
        </Text>
      </TouchableOpacity>

      {/* Center Logo Button - Opens Bottom Sheet */}
      <View style={styles.centerLogoContainer}>
        <TouchableOpacity 
          // style={styles.centerLogoButton}
          onPress={toggleSheet}
        >
          <Image 
            source={require('@/assets/images/group.png')} 
            style={styles.centerLogoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Explore Tab */}
      <TouchableOpacity 
        style={state.index === 3 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate('ExploreTab')}
      >
        <Image
            source={require('@/assets/images/explore.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: state.index === 3 ? "#7B61FF" : "#B3B7C6"
            }}
            resizeMode="contain"
          />
        <Text style={state.index === 3 ? styles.tabLabelActive : styles.tabLabel}>
          Explore
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity 
        style={state.index === 4 ? styles.tabItemActive : styles.tabItem}
        onPress={() => navigation.navigate('Music')}
      >
         <Image
            source={require('@/assets/images/music.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: state.index === 4 ? "#7B61FF" : "#B3B7C6"
            }}
            resizeMode="contain"
          />
        <Text style={state.index === 4 ? styles.tabLabelActive : styles.tabLabel}>
        Music
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#fff', 
    zIndex: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  tabItemActive: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#B3B7C6',
    marginTop: 2,
  },
  tabLabelActive: {
    fontSize: 12,
    color: '#7B61FF',
    marginTop: 2,
    fontWeight: '700',
  },
  centerLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: -30, // Elevate above the tab bar
  },
  centerLogoImage: {
    width: 80,
    height: 80,
  },
});
