import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface BannerCarouselProps {
  banners: React.ReactNode[]; // Espera una lista de <Banner ... />
  intervalMs?: number;
  animationDurationMs?: number; // Nuevo: duración de la animación
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  intervalMs = 12000,
  animationDurationMs = 1000, // Por defecto 1.2s
}) => {
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animación custom con reanimated
  const scrollX = useSharedValue(0);

  // Actualiza scrollX cuando cambia el índice
  useEffect(() => {
    scrollX.value = withTiming(currentIndex * width, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [currentIndex, animationDurationMs, scrollX]);

  // Scroll automático cada intervalMs
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = (currentIndex + 1) % banners.length;
      setCurrentIndex(nextIndex);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentIndex, banners.length, intervalMs]);

  // Ajusta el índice correctamente al terminar el desplazamiento manual
  const onMomentumScrollEnd = (ev: any) => {
    const offset = ev.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / width);
    setCurrentIndex(newIndex);
  };

  // Estilo animado para el wrapper
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -scrollX.value,
      },
    ],
  }));

  return (
    <View style={styles.carouselContainer}>
      <Animated.View style={[{ flexDirection: 'row', width: width * banners.length }, animatedStyle]}>
        {banners.map((item, idx) => (
          <View key={idx} style={{ width }}>{item}</View>
        ))}
      </Animated.View>
      {/* El FlatList ahora solo gestiona el scroll manual */}
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => null} // No renderiza nada, sólo para el scroll
        keyExtractor={(_, idx) => idx.toString()}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => (
          { length: width, offset: width * index, index }
        )}
        initialScrollIndex={currentIndex}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: width,
    height: 250,
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  flatList: {
    flexGrow: 0,
    position: 'absolute',
    width: width,
    height: 250,
    top: 0,
    left: 0,
    zIndex: 5,
  },
});

export default BannerCarousel;