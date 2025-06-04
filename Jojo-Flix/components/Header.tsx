import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar, Text } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onLogoPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
}

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const Header: React.FC<HeaderProps> = ({
  onLogoPress,
  onMenuPress,
  onSearchPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogoPress} style={styles.logoContainer}>
          <MaskedView
            maskElement={
              <Text style={styles.logoText}>JOJO-FLIX</Text>
            }
          >
            <LinearGradient
              colors={['#DF2892', '#fff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </MaskedView>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSearchPress} style={styles.searchButton}>
          <Ionicons name="search" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    width: '100%',
    paddingTop: statusBarHeight + 10,
    paddingBottom: 12,
    elevation: 4,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  menuButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    width: 38,
    height: 38,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Bebas Neue',
    fontSize: 40,
    letterSpacing: 2,
    color: 'black',
    fontWeight: 'normal',
    includeFontPadding: false,
    textAlign: 'center',
  },
  gradient: {
    width: 140,
    height: 48,
  },
  searchButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    width: 36,
    height: 36,
  },
});

export default Header;