import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SoundtrackSelector from '../components/SoundtrackSelector';
import SoundtrackList from '../components/SoundtrackList';
import { ContentItem } from '../components/ContentData';

type ScreenMode = 'selector' | 'tracklist';

const MusicPlayerScreen = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('selector');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const handleSelectContent = (content: ContentItem) => {
    setSelectedContent(content);
    setScreenMode('tracklist');
  };

  const handleBackToSelector = () => {
    setScreenMode('selector');
    setSelectedContent(null);
  };

  const handleCloseMusic = () => {
    // Aquí podrías navegar de vuelta a la pantalla anterior
    setScreenMode('selector');
    setSelectedContent(null);
  };

  return (
    <View style={styles.screen}>
      <Header />
      <View style={styles.container}>
        {screenMode === 'selector' && (
          <SoundtrackSelector
            onSelectContent={handleSelectContent}
            onClose={handleCloseMusic}
          />
        )}
        
        {screenMode === 'tracklist' && selectedContent && (
          <SoundtrackList
            content={selectedContent}
            onBack={handleBackToSelector}
          />
        )}
      </View>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
  },
});

export default MusicPlayerScreen;