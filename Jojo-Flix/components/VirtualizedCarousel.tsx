import React, { memo, useCallback, useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    ListRenderItem,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';
import LazyImage from './LazyImage';

const { width: screenWidth } = Dimensions.get('window');

interface CarouselItem {
  id: string;
  title: string;
  image: any;
  description?: string;
}

interface VirtualizedCarouselProps {
  data: CarouselItem[];
  onItemPress?: (item: CarouselItem) => void;
  itemWidth?: number;
  itemHeight?: number;
  spacing?: number;
  showTitle?: boolean;
  horizontal?: boolean;
  numColumns?: number;
}

const VirtualizedCarousel: React.FC<VirtualizedCarouselProps> = memo(({
  data,
  onItemPress,
  itemWidth = 200,
  itemHeight = 280,
  spacing = 10,
  showTitle = true,
  horizontal = true,
  numColumns = 1
}) => {
  // Calcular dimensiones optimizadas
  const optimizedItemWidth = useMemo(() => {
    if (horizontal) {
      return itemWidth;
    }
    // Para grids verticales, calcular ancho basado en columnas
    const availableWidth = screenWidth - (spacing * (numColumns + 1));
    return availableWidth / numColumns;
  }, [itemWidth, horizontal, numColumns, spacing]);

  // Memoizar el renderizado de items para evitar re-renders innecesarios
  const renderItem: ListRenderItem<CarouselItem> = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        {
          width: optimizedItemWidth,
          height: itemHeight,
          marginRight: horizontal ? spacing : 0,
          marginBottom: horizontal ? 0 : spacing,
          marginLeft: !horizontal && index % numColumns === 0 ? spacing : 0,
        }
      ]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <LazyImage
        source={item.image}
        style={{
          ...styles.itemImage,
          width: optimizedItemWidth,
          height: itemHeight - (showTitle ? 40 : 0)
        }}
        resizeMode="cover"
        showLoader={true}
      />
      
      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  ), [optimizedItemWidth, itemHeight, spacing, horizontal, numColumns, showTitle, onItemPress]);

  // Optimizar getItemLayout para mejorar el rendimiento
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemSize = horizontal ? optimizedItemWidth + spacing : itemHeight + spacing;
    return {
      length: itemSize,
      offset: itemSize * index,
      index,
    };
  }, [optimizedItemWidth, itemHeight, spacing, horizontal]);

  // Key extractor optimizado
  const keyExtractor = useCallback((item: CarouselItem) => item.id, []);

  // Configuración de viewability para lazy loading
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: true,
  }), []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Aquí podrías implementar lógica adicional para precargar imágenes adyacentes
    console.log('Visible items:', viewableItems.length);
  }, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal={horizontal}
      numColumns={horizontal ? 1 : numColumns}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { paddingLeft: horizontal ? spacing : 0 }
      ]}
      getItemLayout={getItemLayout}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      // Optimizaciones de rendimiento
      removeClippedSubviews={true}
      maxToRenderPerBatch={horizontal ? 5 : 10}
      updateCellsBatchingPeriod={50}
      windowSize={horizontal ? 10 : 20}
      initialNumToRender={horizontal ? 3 : 6}
      // Configuración de scroll
      decelerationRate="fast"
      snapToInterval={horizontal ? optimizedItemWidth + spacing : undefined}
      snapToAlignment="start"
      disableIntervalMomentum={true}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  itemContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  } as any,
  titleContainer: {
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

VirtualizedCarousel.displayName = 'VirtualizedCarousel';

export default VirtualizedCarousel;
