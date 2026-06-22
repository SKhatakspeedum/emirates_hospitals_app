import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, ImageBackground } from 'react-native';
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Sleep check-in',
    description: 'Track your sleep hygiene with your sleep check-ins',
    button: 'Start now',
    bg: require('@/assets/images/dashboard_bg_top.png'), // Use a starry night image or gradient
  },
  {
    title: 'Sleep check-out',
    description: 'Reflect on your sleep quality and mood',
    button: 'Start now',
    bg: require('@/assets/images/dashboard_bg_top.png'),
  },
];

export default function SleepCheckInSlider() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(0);

  return (
    <View style={styles.carouselWrapper}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: e => {
            const idx = Math.round((e as any).nativeEvent.contentOffset.x / (width - 64));
            setActive(idx);
          }}
        )}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      >
        {SLIDES.map((slide, idx) => (
          <View key={idx} style={[styles.slide, { width }]}> 
            <ImageBackground source={slide.bg} style={styles.bg} imageStyle={styles.bgImg}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.description}</Text>
              <TouchableOpacity style={styles.slideBtn}>
                <Text style={styles.slideBtnText}>{slide.button} <Text style={styles.arrow}>{'>'}</Text></Text>
              </TouchableOpacity>
              {/* Dots inside the slide, overlayed at bottom center */}
              <View style={styles.dotsRowInSlide} pointerEvents="none">
                {SLIDES.map((_, dotIdx) => (
                  <View
                    key={dotIdx}
                    style={[
                      styles.dotInSlide,
                      active === dotIdx && styles.dotActiveInSlide
                    ]}
                  />
                ))}
              </View>
            </ImageBackground>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    marginTop: 14,
    marginBottom: 20,
    width: '100%',
  },
  slide: {
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  bg: {
    flex: 1,
    width: '100%',
    minHeight: 240,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
  },
  bgImg: {
    resizeMode: 'cover',
  },
  slideTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 2,
  },
  slideDesc: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 18,
    opacity: 0.92,
  },
  slideBtn: {
    borderColor: '#fff',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  arrow: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  dotsRowInSlide: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dotInSlide: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
    marginTop: 2,
  },
  dotActiveInSlide: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
