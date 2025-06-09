import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContentItem, ContentData } from './ContentData';
import VerticalTripleCarousel from './VerticalTripleCarousel';

interface Props {
  onPress?: (item: ContentItem) => void;
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

const VerticalTripleCarouselsByCategory: React.FC<Props> = ({ onPress }) => {
  const categories = getCategories(ContentData);

  return (
    <View>
      {categories.map((category, idx) => {
        const items = ContentData.filter(item => (item.categoria ?? []).includes(category));
        if (items.length === 0) return null;
        return (
          <View
            key={category}
            style={{
              marginBottom: 8,
              marginTop: idx === 0 ? 24 : 0, // <-- Añade espacio solo arriba del primero
            }}
          >
            {category === 'LGTBIQ+' ? (
              <RainbowText>{category}</RainbowText>
            ) : (
              <Text style={styles.category}>{category}</Text>
            )}
            <VerticalTripleCarousel items={items} onPress={onPress} />
          </View>
        );
      })}
    </View>
  );
};

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