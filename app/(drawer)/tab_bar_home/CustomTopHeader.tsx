import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const CustomTopHeader = ({ title }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.topBar}>
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center' }}
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
      <Text style={{
        fontSize: 18,
        fontFamily: 'QuicksandSemiBold',
        marginLeft: 8,
        marginBottom:3,
        color: '#8B4CFC',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  </View>
);
}

import { Platform } from 'react-native';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingTop: 0,
    marginBottom:10,
    marginLeft:0,
    paddingHorizontal:16,
    marginTop: Platform.OS === 'web' ? 0 : Platform.OS === 'ios' ? 40 : 20, 
    height: Platform.OS === 'ios' ? 55 : 60,
    paddingVertical: 0 , borderBottomWidth:1, borderColor:'#ddd'
  },
});

export default CustomTopHeader;