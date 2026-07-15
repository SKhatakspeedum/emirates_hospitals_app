import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  ViewToken,
  Text,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { FontFamilies } from '../config/fonts';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

export interface CarouselItem {
  id: string;
  image: string;
  onPress?: () => void;
}

interface CarouselBannerProps {
  urls: string[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  aspectRatio?: number;
  itemWidth?: number;
  spacing?: number;
}

const CarouselBanner: React.FC<CarouselBannerProps> = ({
  urls = [],
  autoPlay = true,
  autoPlayInterval = 3000,
  aspectRatio = 353 / 122,
  itemWidth,
  spacing = 16,
}) => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window'); // fallback but should use react-native's useWindowDimensions
  const actualItemWidth = itemWidth ?? SCREEN_WIDTH;

  const scrollX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<CarouselItem>>(null);
  const currentIndex = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isPaused = isScrolling || isPressed;


  const data: CarouselItem[] = urls.map((url, i) => ({
    id: `banner-${i}`,
    image: url,
  }));

  const ITEM_LENGTH = actualItemWidth + spacing;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_LENGTH,
    offset: ITEM_LENGTH * index,
    index,
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        currentIndex.current = viewableItems[0].index;
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    if (autoPlay && data.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        const nextIndex = (currentIndex.current + 1) % data.length;
        try {
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch (e) {
          // scrollToIndex can occasionally fail if the layout isn't ready
        }
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, data.length, ITEM_LENGTH, isPaused]);

  const renderItem = ({ item, index }: { item: CarouselItem; index: number }) => {
    return (
      <CarouselCard
        item={item}
        index={index}
        scrollX={scrollX}
        aspectRatio={aspectRatio}
        itemWidth={actualItemWidth}
        spacing={spacing}
        setIsPressed={setIsPressed}
      />
    );
  };

  if (!urls || urls.length === 0) {
    return (
      <React.Fragment>
        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>SAVE 20%</Text>
            </View>
            <Text style={styles.promoTitle}>
              20% off on Health Checkups
            </Text>
            <Text style={styles.promoSub}>
              Book before July 20th • All branches
            </Text>
          </View>
          <FontAwesome5
            name="hospital"
            size={80}
            color="rgba(255,255,255,0.15)"
            style={styles.promoIcon}
          />
        </View>
        <View style={styles.promoPaginationDots}>
          <View style={[styles.promoDot, styles.promoDotActive]} />
          <View style={styles.promoDot} />
          <View style={styles.promoDot} />
        </View>
      </React.Fragment>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        scrollEventThrottle={16}
        pagingEnabled={true}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        style={{ width: ITEM_LENGTH, marginLeft: -spacing / 2 }}
        contentContainerStyle={styles.flatListContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <PaginationDots data={data} scrollX={scrollX} itemWidth={actualItemWidth} spacing={spacing} />
    </View>
  );
};

interface CarouselCardProps {
  item: CarouselItem;
  index: number;
  scrollX: Animated.SharedValue<number>;
  aspectRatio: number;
  itemWidth: number;
  spacing: number;
  setIsPressed: (pressed: boolean) => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({
  item,
  index,
  scrollX,
  aspectRatio,
  itemWidth,
  spacing,
  setIsPressed,
}) => {
  const ITEM_LENGTH = itemWidth + spacing;
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_LENGTH,
      index * ITEM_LENGTH,
      (index + 1) * ITEM_LENGTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [1, 1, 1], // Removed dimming to keep it bright during swipe
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: 1 }], // Removed scale effect for full width
      opacity,
    };
  });

  return (
    <Pressable
      onPress={item.onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.cardContainer, { width: ITEM_LENGTH, paddingHorizontal: spacing / 2 }]}
    >
      <Animated.View style={[styles.card, { aspectRatio, width: itemWidth, borderRadius: 12 }, animatedStyle]}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </Animated.View>
    </Pressable>
  );
};

interface PaginationDotsProps {
  data: CarouselItem[];
  scrollX: Animated.SharedValue<number>;
  itemWidth: number;
  spacing: number;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({ data, scrollX, itemWidth, spacing }) => {
  return (
    <View style={styles.pagination}>
      {data.map((_, index) => {
        return (
          <PaginationDot key={index} index={index} scrollX={scrollX} itemWidth={itemWidth} spacing={spacing} />
        );
      })}
    </View>
  );
};

interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  itemWidth: number;
  spacing: number;
}

const PaginationDot: React.FC<PaginationDotProps> = ({ index, scrollX, itemWidth, spacing }) => {
  const ITEM_LENGTH = itemWidth + spacing;
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_LENGTH,
      index * ITEM_LENGTH,
      (index + 1) * ITEM_LENGTH,
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 20, 8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
  },
  promoBanner: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
  },
  promoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  promoBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontFamily: FontFamilies.bold,
  },
  promoTitle: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: FontFamilies.bold,
    marginBottom: 6,
  },
  promoSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  promoIcon: {
    position: "absolute",
    right: -10,
    bottom: -15,
    zIndex: 1,
  },
  promoPaginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  promoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inactive,
    marginHorizontal: 3,
  },
  promoDotActive: {
    width: 24,
    backgroundColor: Colors.secondary,
  },
  flatListContent: {
    paddingHorizontal: 0,
  },
  cardContainer: {
    paddingHorizontal: 0,
  },
  card: {
    overflow: 'hidden',
    backgroundColor: Colors.background,
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
});

export default CarouselBanner;    