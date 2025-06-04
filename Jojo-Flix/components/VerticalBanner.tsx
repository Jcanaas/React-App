import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = Math.round(width / 3.33); // 3 banners + 1/3 de la siguiente

interface Banner {
  verticalbanner: any; // Debe ser la URL de la imagen vertical
}

interface Props {
  banner: Banner;
}

const VerticalBanner: React.FC<Props> = ({ banner }) => (
  <View style={styles.bannerContainer}>
    <Image
      source={{ uri: banner.verticalbanner }}
      style={styles.image}
      resizeMode="cover"
    />
  </View>
);

const styles = StyleSheet.create({
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_WIDTH * 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginRight: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default VerticalBanner;