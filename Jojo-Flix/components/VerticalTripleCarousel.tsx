import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ContentItem } from './ContentData';
import OptimizedImage from './OptimizedImage';

const { width } = Dimensions.get('window');
const isMobile = width < 700; // Umbral para móvil/escritorio

// Calcula cuántos items caben en pantalla según el dispositivo
const VISIBLE_ITEMS = isMobile ? 3 : Math.floor(width / 160); // 160px aprox de ancho por item en PC
const GAP = 16;
const HORIZONTAL_PADDING = 16 * 2;
const ITEM_WIDTH = isMobile
  ? (width - HORIZONTAL_PADDING - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS
  : 180; // 1/3 más pequeño en PC
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface Props {
  items: ContentItem[];
  onPress?: (item: ContentItem) => void;
}

const REPEAT = 10;

const VerticalTripleCarousel: React.FC<Props> = memo(({ items }) => {
  const router = useRouter();
  // Repite los items para simular loop
  const loopItems = Array(REPEAT).fill(items).flat();
  const listRef = useRef<FlatList>(null);

  // Centra el scroll al inicio
  useEffect(() => {
    if (listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: Math.floor(loopItems.length / 2),
          animated: false,
        });
      }, 10);
    }
  }, [items.length, loopItems.length]);

  const renderItem = useCallback(({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/content-detail-screen', params: { contentId: item.id } })}
    >
      <OptimizedImage
        source={item.verticalbanner}
        style={styles.image}
        resizeMode="cover"
        showLoader={true}
      />
    </TouchableOpacity>
  ), [router]);

  const keyExtractor = useCallback((item: ContentItem, idx: number) => `${item.id}-${idx}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_WIDTH + GAP,
    offset: (ITEM_WIDTH + GAP) * index,
    index,
  }), []);

  return (
    <FlatList
      ref={listRef}
      data={loopItems}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      getItemLayout={getItemLayout}
      snapToInterval={ITEM_WIDTH + GAP}
      decelerationRate="fast"
      initialNumToRender={VISIBLE_ITEMS * 2}
      // Optimizaciones de rendimiento
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      windowSize={10}
    />
  );
});

VerticalTripleCarousel.displayName = 'VerticalTripleCarousel';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 32,
    marginVertical: 24,
    paddingHorizontal: 16,
    gap: GAP,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default VerticalTripleCarousel;