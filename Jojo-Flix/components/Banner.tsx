import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface BannerProps {
  fondo: any;
  logo: any;
}

const Banner: React.FC<BannerProps> = ({ fondo, logo }) => {
  return (
    <View style={styles.container}>
      <Image source={fondo} style={styles.backgroundImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.button}>
          <Ionicons name="play" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Ver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 250,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 250,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  content: {
    marginTop: 44,
    width: '100%',
    zIndex: 3,
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  logo: {
    height: 90,
    width: 220, // Ajusta este valor según el tamaño real del logo
    backgroundColor: 'transparent',
    marginLeft: 15,
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderWidth: 0,
    borderColor: 'red',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 2,
    marginTop: 2,
    marginLeft: 15,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default Banner;