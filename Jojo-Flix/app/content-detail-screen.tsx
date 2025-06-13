import React from 'react';
import ContentDetailScreen from '../components/ContentDetailScreen';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { View, StyleSheet } from 'react-native';

export default function ContentDetailScreenWithLayout(props: any) {
  return (
    <View style={styles.screen}>
      <Header />
      <ContentDetailScreen {...props} />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#181818',
  },
});