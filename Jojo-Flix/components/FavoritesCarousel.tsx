import React, { memo, useCallback } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ContentData, ContentItem } from './ContentData';
import OptimizedImage from './OptimizedImage';

const { width } = Dimensions.get('window');
const isMobile = width < 700;

// Configuración del carousel para favoritos
const VISIBLE_ITEMS = isMobile ? 2.5 : 4; // Mostrar menos items para que se vean más grandes
const GAP = 12;
const HORIZONTAL_PADDING = 16 * 2;
const ITEM_WIDTH = isMobile
  ? (width - HORIZONTAL_PADDING - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS
  : 140;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5; // Ratio 2:3 para posters

interface FavoritesCarouselProps {
  favoriteIds: string[]; // IDs de los contenidos favoritos
}

const FavoritesCarousel: React.FC<FavoritesCarouselProps> = memo(({ favoriteIds }) => {
  const router = useRouter();

  // Obtener los datos completos de los favoritos
  const favoriteItems = favoriteIds
    .map(id => ContentData.find(item => item.id === id))
    .filter((item): item is ContentItem => item !== undefined);

  const renderItem = useCallback(({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.8}
      onPress={() => router.push({ 
        pathname: '/content-detail-screen', 
        params: { contentId: item.id } 
      })}
    >
      <View style={styles.posterContainer}>
        <OptimizedImage
          source={item.verticalbanner}
          style={styles.poster}
          resizeMode="cover"
          showLoader={true}
        />
        
        {/* Badge de favorito */}
        <View style={styles.favoriteBadge}>
          <Text style={styles.favoriteIcon}>❤️</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [router]);

  const keyExtractor = useCallback((item: ContentItem) => `fav-${item.id}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_WIDTH + GAP,
    offset: (ITEM_WIDTH + GAP) * index,
    index,
  }), []);

  if (favoriteItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💝</Text>
        <Text style={styles.emptyText}>Aún no tienes favoritos</Text>
        <Text style={styles.emptySubtext}>¡Explora contenido y marca tus favoritos!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Mis Favoritos</Text>
        <Text style={styles.count}>{favoriteItems.length}</Text>
      </View>
      
      <FlatList
        data={favoriteItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        getItemLayout={getItemLayout}
        snapToInterval={ITEM_WIDTH + GAP}
        decelerationRate="fast"
        initialNumToRender={Math.ceil(VISIBLE_ITEMS) + 1}
        // Optimizaciones de rendimiento
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        windowSize={5}
      />
    </View>
  );
});

FavoritesCarousel.displayName = 'FavoritesCarousel';

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DF2892',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DF2892',
    backgroundColor: 'rgba(223, 40, 146, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: GAP,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  },
  posterContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#DF2892',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default FavoritesCarousel;
