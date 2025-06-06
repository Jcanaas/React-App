import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useFonts } from 'expo-font';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BannerCarousel from '../../components/BannerCarousel';
import ContentDetailScreen from '../../components/ContentDetailScreen';
import { ContentItem } from '../../components/ContentData';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../../assets/fonts/BN.ttf'),
  });
  const [showFooter, setShowFooter] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

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
      <Header onLogoPress={() => setSelectedContent(null)} />
      {selectedContent ? (
        <ContentDetailScreen
          content={selectedContent}
          onBack={() => setSelectedContent(null)}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ minHeight: 900 }}
        >
          <BannerCarousel
            nombres={[
              'Beck: Mongolian Chop Squad',
              'The Last of Us',
              'Monster',
              'Devil May Cry'
            ]}
            onVerPress={item => setSelectedContent(item)}
          />
        </ScrollView>
      )}
      <Footer />
    </View>
  );
}