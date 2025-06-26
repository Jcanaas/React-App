import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const Footer: React.FC = () => (
  <View style={styles.footerContainer}>
    <MaskedView
      maskElement={<Text style={styles.logoText}>JOJO-FLIX</Text>}
    >
      <LinearGradient
        colors={['#DF2892', '#fff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </MaskedView>
    <Text style={styles.copyright}>
      © 2025 JoJo-Flix. Ninguno de los derechos reservados.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    backgroundColor: '#181818',
    alignItems: 'center',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#222',
    marginBottom: 24, 
  },
  gradient: {
    width: 180,
    height: 40,
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Bebas Neue',
    fontSize: 34,
    letterSpacing: 2,
    color: 'black',
    fontWeight: 'normal',
    textAlign: 'center',
    includeFontPadding: false,
  },
  copyright: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default Footer;