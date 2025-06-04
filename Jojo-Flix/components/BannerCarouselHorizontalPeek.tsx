import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';

interface BannerCarouselProps {
  banners: React.ReactNode[];
  intervalMs?: number;
}

const VISIBLE_BANNERS = 3;
const PEEK_FRACTION = 0.33; // Muestra 1/3 del siguiente banner

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
// Altura vertical (por ejemplo, 3:4 de ancho)
const BANNER_HEIGHT = Math.round(windowHeight * 0.5);
const BANNER_WIDTH = Math.round(windowWidth / (VISIBLE_BANNERS + PEEK_FRACTION));

const BannerCarouselHorizontalPeek: React.FC<BannerCarouselProps> = ({
  banners,
  intervalMs = 12000,
}) => {
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scroll automático
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = (currentIndex + 1) % banners.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentIndex, banners.length, intervalMs]);

  // Ajusta el índice correctamente al terminar el desplazamiento manual
  const onMomentumScrollEnd = (ev: any) => {
    const offset = ev.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / BANNER_WIDTH);
    setCurrentIndex(newIndex);
  };

  return (
    <View style={[styles.carouselContainer, { width: BANNER_WIDTH * VISIBLE_BANNERS + BANNER_WIDTH * PEEK_FRACTION, height: BANNER_HEIGHT }]}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT, marginRight: 0 }}>{item}</View>
        )}
        keyExtractor={(_, idx) => idx.toString()}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => (
          { length: BANNER_WIDTH, offset: BANNER_WIDTH * index, index }
        )}
        initialScrollIndex={currentIndex}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    backgroundColor: 'black',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  flatList: {
    flexGrow: 0,
  },
});

export default BannerCarouselHorizontalPeek;