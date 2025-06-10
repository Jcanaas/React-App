import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useFonts } from 'expo-font';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BannerCarousel from '../../components/BannerCarousel';
import ContentDetailScreen from '../../components/ContentDetailScreen';
import { ContentItem } from '../../components/ContentData';
import VerticalTripleCarouselsByCategory from '../../components/VerticalTripleCarouselsByCategory';
import { SearchProvider } from '../../components/SearchContent';
import SearchModal from '../../components/SearchModal'; // <-- Importa el modal
import CategoryModal from '../../components/CategoryModal';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../../assets/fonts/BN.ttf'),
  });
  const [showFooter, setShowFooter] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Estado para mostrar el modal de búsqueda
  const [searchVisible, setSearchVisible] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    <SearchProvider>
      <View style={{ flex: 1, backgroundColor: '#181818', position: 'relative' }}>
        <Header
          onLogoPress={() => setSelectedContent(null)}
          onSearchPress={() => setSearchVisible(true)}
          onMenuPress={() => setCategoryVisible(true)}
        />
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
            contentContainerStyle={{ minHeight: 900, paddingBottom: 300 }}
          >
            <BannerCarousel
              nombres={[
                'Beck: Mongolian Chop Squad',
                'Monster',
                'Old Boy'
              ]}
              onVerPress={item => setSelectedContent(item)}
            />
            <VerticalTripleCarouselsByCategory
              onPress={setSelectedContent}
              filterCategories={selectedCategories}
            />
          </ScrollView>
        )}
        {showFooter && <Footer />}
        <CategoryModal
          visible={categoryVisible}
          setVisible={setCategoryVisible}
          selected={selectedCategories}
          setSelected={setSelectedCategories}
        />
      </View>
      <SearchModal
        visible={searchVisible}
        setVisible={setSearchVisible}
        onSelect={item => {
          setSelectedContent(item);
          setSearchVisible(false);
        }}
      />
    </SearchProvider>
  );
}