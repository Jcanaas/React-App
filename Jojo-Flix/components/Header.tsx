// Header.tsx
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar, Text, Image, Dimensions } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';

interface HeaderProps {
  onLogoPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onSocialPress?: () => void;
}

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const Header: React.FC<HeaderProps> = ({
  onLogoPress,
  onMenuPress,
  onSearchPress,
  onSocialPress,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(48);

  // Calcular el tamaño de fuente basado en el ancho de la pantalla
  useEffect(() => {
    const calculateFontSize = () => {
      const screenWidth = Dimensions.get('window').width;
      // Reservar espacio para los botones laterales (aproximadamente 200px en total)
      const availableWidth = screenWidth - 200;
      
      // "JOJO-FLIX" tiene 9 caracteres
      // Con la fuente Bebas Neue, cada carácter ocupa aproximadamente 0.55 del fontSize
      // Más el letterSpacing de 2px entre caracteres
      const charWidth = 0.55;
      const letterSpacing = 2;
      const totalChars = 9;
      
      // Calcular el ancho total del texto: (fontSize * charWidth * totalChars) + (letterSpacing * (totalChars - 1))
      // Resolver para fontSize: availableWidth = (fontSize * charWidth * totalChars) + (letterSpacing * (totalChars - 1))
      const spacingWidth = letterSpacing * (totalChars - 1);
      const optimalFontSize = (availableWidth - spacingWidth) / (charWidth * totalChars);
      
      // Limitar entre un mínimo y máximo razonable
      const finalFontSize = Math.max(16, Math.min(48, optimalFontSize));
      
      setFontSize(finalFontSize);
    };

    calculateFontSize();
    
    const subscription = Dimensions.addEventListener('change', calculateFontSize);
    return () => subscription?.remove();
  }, []);

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

  const handleMenu = () => {
    pathname !== '/' ? router.push('/') : onMenuPress?.();
  };
  const handleLogo = () => {
    pathname !== '/' ? router.push('/') : onLogoPress?.();
  };
  const handleSearch = () => {
    pathname !== '/' ? router.push('/') : onSearchPress?.();
  };
  const handleSocial = () => {
    router.push('/social');
  };
  const handleUser = () => router.push('/user-info');

  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>

        {/* Lado izquierdo */}
        <View style={styles.side}>
          <TouchableOpacity onPress={handleMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSocial} style={styles.iconButton}>
            <Ionicons name="people" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logo centrado */}
        <View style={styles.centerLogo}>
          <TouchableOpacity onPress={handleLogo} activeOpacity={0.8}>
            {Platform.OS === 'web' ? (
              <span
                style={{
                  fontFamily: 'Bebas Neue',
                  fontWeight: 'bold',
                  fontSize: fontSize,
                  letterSpacing: 2,
                  background: 'linear-gradient(180deg, #ff5fa2 0%, #fff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                }}
              >
                JOJO-FLIX
              </span>
            ) : (
              <MaskedView
                maskElement={
                  <Text style={[styles.maskedText, { fontSize: fontSize }]}>JOJO-FLIX</Text>
                }
              >
                <LinearGradient
                  colors={['#ff5fa2', '#fff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <Text style={[styles.maskedText, { fontSize: fontSize, opacity: 0 }]}>
                    JOJO-FLIX
                  </Text>
                </LinearGradient>
              </MaskedView>
            )}
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
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  menuButton: {
    padding: 6,
    marginRight: 8,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  centerLogo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8, // Añadir un poco de padding para evitar cortes
  },
  maskedText: {
    fontFamily: 'Bebas Neue',
    fontSize: 48, // Este será sobrescrito dinámicamente
    letterSpacing: 2,
    textAlign: 'center',
    color: 'black', // necesario para que MaskedView funcione bien
    includeFontPadding: false,
    flexShrink: 1, // Permite que el texto se reduzca si es necesario
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222',
  },
});

export default Header;
