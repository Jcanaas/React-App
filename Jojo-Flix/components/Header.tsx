import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar, Text, Image } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from './SearchContent';
import { useRouter, usePathname } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig'; // asegúrate de importar db

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
  const router = useRouter();
  const pathname = usePathname();

  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPhoto = async () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserPhoto(data.profileImage || null);
        } else {
          setUserPhoto(null);
        }
      } else {
        setUserPhoto(null);
      }
    };
    fetchUserPhoto();
  }, [auth.currentUser]);

  // Si no estamos en index, navega al index. Si estamos, ejecuta la acción original.
  const handleMenu = () => {
    if (pathname !== '/') {
      router.push('/');
    } else if (onMenuPress) {
      onMenuPress();
    }
  };

  const handleLogo = () => {
    if (pathname !== '/') {
      router.push('/');
    } else if (onLogoPress) {
      onLogoPress();
    }
  };

  const handleSearch = () => {
    if (pathname !== '/') {
      router.push('/');
    } else if (onSearchPress) {
      onSearchPress();
    }
  };

  const handleUser = () => {
    if (pathname !== '/') {
      router.push('/');
    } else {
      router.push('/user-info');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        {/* Lado izquierdo */}
        <View style={styles.side}>
          <TouchableOpacity onPress={handleMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logo centrado */}
        <View style={styles.centerLogo}>
          <TouchableOpacity onPress={handleLogo} activeOpacity={0.8}>
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
        </View>

        {/* Lado derecho */}
        <View style={styles.side}>
          <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
            <Ionicons name="search" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUser} style={styles.iconButton}>
            {userPhoto ? (
              <Image
                source={{ uri: userPhoto }}
                style={styles.userAvatar}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
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
    position: 'relative',
  },
  menuButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    width: 38,
    height: 38,
  },
  centerLogo: {
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
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 70, // Ajusta este valor según el ancho de tus iconos
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222',
  },
});

export default Header;