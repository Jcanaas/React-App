import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ContentData, ContentItem } from './ContentData';

const windowWidth = Dimensions.get('window').width;
const isMobile = windowWidth < 700; // Ajusta el umbral si lo necesitas
const BANNER_ASPECT_RATIO = isMobile ? 16 / 9 : 21 / 8;
const bannerHeight = Math.round(windowWidth / BANNER_ASPECT_RATIO);

interface BannerCarouselProps {
  nombres: string[];
  intervalMs?: number;
  onVerPress?: (item: ContentItem) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = memo(({ nombres, intervalMs = 5000 }) => {
  const router = useRouter();
  const banners = ContentData.filter(item => nombres.includes(item.nombre));
  // Duplica los banners para simular el loop
  const loopBanners = [...banners, ...banners, ...banners];
  const realLength = banners.length;
  // Corrige el initialIndex para que nunca esté fuera de rango
  const initialIndex = Math.max(0, Math.min(realLength, loopBanners.length - 1));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<ContentItem>>(null);

  // Auto-scroll con loop
  useEffect(() => {
    if (realLength <= 1) return;
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      // Limita el índice antes de usarlo
      const safeIndex = Math.max(0, Math.min(nextIndex, loopBanners.length - 1));
      setCurrentIndex(safeIndex);
      flatListRef.current?.scrollToIndex({ index: safeIndex, animated: true });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [currentIndex, realLength, intervalMs, loopBanners.length]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / windowWidth);
    let correctedIndex = newIndex;
    if (newIndex >= realLength * 2) {
      correctedIndex = realLength;
    } else if (newIndex < realLength) {
      correctedIndex = realLength + (newIndex % realLength);
    }
    // Limita el índice antes de usarlo
    correctedIndex = Math.max(0, Math.min(correctedIndex, loopBanners.length - 1));
    if (correctedIndex !== newIndex) {
      flatListRef.current?.scrollToIndex({ index: correctedIndex, animated: false });
    }
    setCurrentIndex(correctedIndex);
  }, [realLength, loopBanners.length]);

  const renderItem = useCallback(({ item }: { item: ContentItem }) => (
    <View style={styles.bannerContainer}>
      <Image source={item.fondo} style={styles.backgroundImage} />
      <View style={styles.overlay} />
      <View style={styles.logoAndButtonContainer}>
        <Image source={item.logo} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity
          style={styles.verButton}
          onPress={() => router.push({ pathname: '/content-detail-screen', params: { contentId: item.id } })}
          activeOpacity={0.8}
        >
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.verButtonText}>Ver</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [router]);

  return (
    <FlatList
      ref={flatListRef}
      data={loopBanners}
      renderItem={renderItem}
      keyExtractor={(_, idx) => idx.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      getItemLayout={(_, index) => ({
        length: windowWidth,
        offset: windowWidth * index,
        index,
      })}
      initialScrollIndex={initialIndex}
      onMomentumScrollEnd={onMomentumScrollEnd}
      style={{ flexGrow: 0 }}
      // Optimizaciones de rendimiento
      removeClippedSubviews={true}
      maxToRenderPerBatch={2}
      updateCellsBatchingPeriod={50}
      windowSize={5}
      initialNumToRender={2}
      decelerationRate="fast"
    />
  );
});

BannerCarousel.displayName = 'BannerCarousel';

const styles = StyleSheet.create({
  bannerContainer: {
    width: windowWidth,
    height: bannerHeight,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  logoAndButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 32,
    zIndex: 2,
    height: '100%',
  },
  logo: {
    width: isMobile ? 220 : 440,   // Doble de ancho en PC
    height: isMobile ? 90 : 180,   // Doble de alto en PC
    marginBottom: 18,
  },
  verButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verButtonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 6,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default BannerCarousel;