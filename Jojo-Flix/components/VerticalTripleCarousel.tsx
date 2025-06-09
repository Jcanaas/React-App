import React, { useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList } from 'react-native';
import { ContentItem } from './ContentData';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16 * 2; // 16 a cada lado
const GAP = 16; // Solo 2 gaps entre 3 items
const ITEM_WIDTH = (width - HORIZONTAL_PADDING - GAP * 2) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface Props {
  items: ContentItem[];
  onPress?: (item: ContentItem) => void;
}

const VISIBLE_ITEMS = 3;
const REPEAT = 10;

const VerticalTripleCarousel: React.FC<Props> = ({ items, onPress }) => {
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
  }, [items]);

  return (
    <FlatList
      ref={listRef}
      data={loopItems}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => onPress && onPress(item)}
        >
          <Image
            source={item.verticalbanner}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.container}
      getItemLayout={(_, index) => ({
        length: ITEM_WIDTH + 16,
        offset: (ITEM_WIDTH + 16) * index,
        index,
      })}
      snapToInterval={ITEM_WIDTH + 16}
      decelerationRate="fast"
      initialNumToRender={VISIBLE_ITEMS * 2}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 32,
    marginVertical: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
    elevation: 4,
    // No marginRight aquí
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default VerticalTripleCarousel;