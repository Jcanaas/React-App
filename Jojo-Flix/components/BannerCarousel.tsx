import React, { useRef, useEffect, useState } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity, Text, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ContentData, ContentItem } from './ContentData';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface BannerCarouselProps {
  nombres: string[];
  intervalMs?: number;
  onVerPress?: (item: ContentItem) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ nombres, intervalMs = 5000, onVerPress }) => {
  const banners = ContentData.filter(item => nombres.includes(item.nombre));
  // Duplica los banners para simular el loop
  const loopBanners = [...banners, ...banners, ...banners];
  const realLength = banners.length;
  const initialIndex = realLength; // Empieza en la "mitad" para permitir loop en ambos sentidos

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<ContentItem>>(null);

  // Auto-scroll con loop
  useEffect(() => {
    if (realLength <= 1) return;
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [currentIndex, realLength, intervalMs]);

  // Corrige el índice cuando llegas a los extremos
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    let correctedIndex = newIndex;
    if (newIndex >= realLength * 2) {
      correctedIndex = realLength;
      flatListRef.current?.scrollToIndex({ index: correctedIndex, animated: false });
    } else if (newIndex < realLength) {
      correctedIndex = realLength + (newIndex % realLength);
      flatListRef.current?.scrollToIndex({ index: correctedIndex, animated: false });
    }
    setCurrentIndex(correctedIndex);
  };

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.bannerContainer}>
      <Image source={item.fondo} style={styles.backgroundImage} />
      <View style={styles.overlay} />
      <View style={styles.logoAndButtonContainer}>
        <Image source={item.logo} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity
          style={styles.verButton}
          onPress={() => onVerPress && onVerPress(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.verButtonText}>Ver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        length: width,
        offset: width * index,
        index,
      })}
      initialScrollIndex={initialIndex}
      onMomentumScrollEnd={onMomentumScrollEnd}
      style={{ flexGrow: 0 }}
    />
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width,
    height: 240,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
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
    width: 220,
    height: 90,
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