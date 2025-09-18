import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MusicPlayer from '../components/MusicPlayer';

const MusicPlayerScreen = () => {
  const [showPlayer, setShowPlayer] = useState(true);

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {showPlayer && (
          <MusicPlayer 
            title="Follow Me [Live]"
            artist="Beck"
            onClose={() => setShowPlayer(false)}
          />
        )}
      </ScrollView>
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
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
});

export default MusicPlayerScreen;