import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useFonts } from 'expo-font';
import Header from '../../components/Header';
import BannerList from '../../components/BannerList'; // <-- Cambia aquí
import Footer from '../../components/Footer';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../../assets/fonts/BN.ttf'),
  });
  const [showFooter, setShowFooter] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowFooter(isBottom);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#181818' }}>
      <Header />
      <ScrollView
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ minHeight: 900 }} // Asegura espacio para scroll
      >
        <BannerList />  {/* <-- Cambia esto por BannerList */}
        {/* Contenido principal aquí */}
        <View style={{ height: 600 }} /> {/* Simula contenido */}
        {showFooter && <Footer />}
      </ScrollView>
    </View>
  );
}