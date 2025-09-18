import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Button } from 'react-native';
import { auth, db } from '../components/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FavoritesCarousel from '../components/FavoritesCarousel';
import { useRouter } from 'expo-router';

const placeholderImg = 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff';

const exampleImages = [
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_beck.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_ellietlou.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_green.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_orange.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_pink.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_purple.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_red.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_white.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_yellow.png',
];

const UserInfoScreen = () => {
  const [userData, setUserData] = useState<{ name: string; email: string; profileImage?: string; favoritos?: { [key: string]: any } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data() as any);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleChangeProfileImage = async (url: string) => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { profileImage: url });
      setUserData(prev => prev ? { ...prev, profileImage: url } : prev);
      setModalVisible(false);
      setCustomUrl('');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.');
    }
    setSaving(false);
  };

  // Obtener favoritos del usuario (con id)
  const favoritos = userData?.favoritos ? Object.entries(userData.favoritos) : [];

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#DF2892" size="large" />
          </View>
        ) : !userData ? (
          <Text style={styles.title}>No hay datos de usuario</Text>
        ) : (
          <View>
            {/* Avatar con opción de cambiar */}
            <View style={styles.userInfoSection}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={() => setModalVisible(true)}>
                <View style={styles.avatarBorder}>
                  <Image
                    source={{ uri: userData.profileImage || placeholderImg }}
                    style={styles.avatar}
                    resizeMode="contain"
                    defaultSource={{ uri: placeholderImg }}
                  />
                </View>
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Información del usuario</Text>
              <Text style={styles.name}>{userData.name}</Text>
              <Text style={styles.email}>{userData.email}</Text>
            </View>
            {/* Sección Favoritos con Carousel */}
            <FavoritesCarousel 
              favoriteIds={favoritos.map(([favId]) => favId)}
            />
            {/* Botón de cerrar sesión */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => signOut(auth)}
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <Footer />

      {/* Modal para cambiar imagen */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Elige una imagen de perfil</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {exampleImages.map((img, idx) => (
                <TouchableOpacity key={img} onPress={() => handleChangeProfileImage(img)}>
                  <View style={styles.exampleImgBorder}>
                    <Image source={{ uri: img }} style={styles.exampleImg} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ marginBottom: 6, color: '#fff' }}>O pega una URL personalizada:</Text>
            <TextInput
              style={styles.input}
              placeholder="URL de imagen"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#DF2892' }]}
                onPress={() => customUrl ? handleChangeProfileImage(customUrl) : null}
                disabled={saving || !customUrl}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#aaa' }]}
                onPress={() => { setModalVisible(false); setCustomUrl(''); }}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#181818',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#DF2892',
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  title: {
    color: '#DF2892',
    fontSize: 22,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  email: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 24,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#DF2892',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  logoutSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  changePhotoText: {
    color: '#DF2892',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
    width: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#DF2892', // Rosa para destacar
    textAlign: 'center',
  },
  exampleImgBorder: {
    padding: 2, // Menos espacio entre borde e imagen
    borderRadius: 55, // Igual o mayor que la mitad del tamaño total (56+2+2)/2 = 30
    borderWidth: 3,
    borderColor: '#DF2892',
    backgroundColor: '#181818',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleImg: {
    width: 56,
    height: 56,
    borderRadius: 28, // Redondo
    backgroundColor: '#222',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 220,
    marginBottom: 4,
    fontSize: 15,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 4,
  },
});

export default UserInfoScreen;