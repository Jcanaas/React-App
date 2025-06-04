import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import BannerCarouselHorizontalPeek from './BannerCarouselHorizontalPeek';
import VerticalBanner from './VerticalBanner';

// Ahora el banner solo tiene id y verticalbanner
interface Banner {
  id: string;
  verticalbanner: string;
}

interface Category {
  name: string;
  banners: Banner[];
}

interface Props {
  categories: Category[];
}

const MultiCategoryBannerCarousels: React.FC<Props> = ({ categories }) => (
  <ScrollView>
    {categories.map((category) => (
      <View key={category.name} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category.name}</Text>
        <BannerCarouselHorizontalPeek
          banners={category.banners.map(banner => (
            <VerticalBanner
              key={banner.id}
              banner={banner}
            />
          ))}
        />
      </View>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    marginLeft: 16,
    marginBottom: 8,
    color: '#fff'
  },
});

export default MultiCategoryBannerCarousels;