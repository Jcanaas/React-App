import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ContentData, ContentItem } from './ContentData';
import VerticalTripleCarousel from './VerticalTripleCarousel';

interface Props {
  onPress: (item: ContentItem) => void;
  filterCategories?: string[];
}

const getCategories = (data: ContentItem[]) => {
  const cats = new Set<string>();
  data.forEach(item => item.categoria?.forEach(cat => cats.add(cat)));
  return Array.from(cats);
};

const rainbowColors = [
  '#FF0000', // Rojo
  '#FF9900', // Naranja
  '#FFFF00', // Amarillo
  '#00FF00', // Verde
  '#0000FF', // Azul
  '#8B00FF', // Violeta
  // '#FF0000', // Rojo (NO lo repitas al final)
];

const RainbowText: React.FC<{ children: string }> = ({ children }) => {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animated, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // Para cada letra, calcula un desfase para el gradiente animado
  return (
    <Text style={styles.rainbow}>
      {children.split('').map((char, i) => {
        const letterAnimated = animated.interpolate({
          inputRange: [0, 1],
          outputRange: [i / children.length, 1 + i / children.length],
        });

        const color = letterAnimated.interpolate({
          inputRange: rainbowColors.map((_, idx) => idx / (rainbowColors.length - 1)),
          outputRange: rainbowColors,
        });

        return (
          <Animated.Text key={i} style={{ color }}>
            {char}
          </Animated.Text>
        );
      })}
    </Text>
  );
};

const VerticalTripleCarouselsByCategory: React.FC<Props> = memo(({ onPress, filterCategories }) => {
  const categories = useMemo(() => getCategories(ContentData), []);

  const filteredData = useMemo(() => {
    return filterCategories && filterCategories.length > 0
      ? ContentData.filter(item =>
          (item.categoria ?? []).some(cat => filterCategories.includes(cat))
        )
      : ContentData;
  }, [filterCategories]);

  const categorizedItems = useMemo(() => {
    return categories.map(category => ({
      category,
      items: filteredData.filter(item => (item.categoria ?? []).includes(category))
    })).filter(({ items }) => items.length > 0);
  }, [categories, filteredData]);

  return (
    <View>
      {categorizedItems.map(({ category, items }, idx) => (
        <View
          key={category}
          style={{
            marginBottom: 8,
            marginTop: idx === 0 ? 24 : 0,
          }}
        >
          {category === 'LGTBIQ+' ? (
            <RainbowText>{category}</RainbowText>
          ) : (
            <Text style={styles.category}>{category}</Text>
          )}
          <VerticalTripleCarousel items={items} onPress={onPress} />
        </View>
      ))}
    </View>
  );
});

VerticalTripleCarouselsByCategory.displayName = 'VerticalTripleCarouselsByCategory';

const styles = StyleSheet.create({
  category: {
    fontFamily: 'Bebas Neue',
    fontSize: 28,
    color: '#fff',
    marginLeft: 16,
    marginBottom: 0, // <-- Cambia de 8 a 0
    letterSpacing: 2,
    textAlign: 'left',
  },
  rainbow: {
    fontFamily: 'Bebas Neue',
    fontSize: 28,
    marginLeft: 16,
    marginBottom: 0, // <-- Cambia de 8 a 0
    letterSpacing: 2,
    textAlign: 'left',
    color: 'white',
    backgroundColor: 'transparent',
  },
});

export default VerticalTripleCarouselsByCategory;