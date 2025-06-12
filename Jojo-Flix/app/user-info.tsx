import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth, db } from '../components/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

const placeholderImg = 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff';

const UserInfoScreen = () => {
  const [userData, setUserData] = useState<{ name: string; email: string; profileImage?: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.screen}>
      <Header />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#DF2892" size="large" />
        ) : !userData ? (
          <Text style={styles.title}>No hay datos de usuario</Text>
        ) : (
          <>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: userData.profileImage || placeholderImg }}
                style={styles.avatar}
                resizeMode="contain"
                defaultSource={{ uri: placeholderImg }}
              />
            </View>
            <Text style={styles.title}>Información del usuario</Text>
            <Text style={styles.name}>{userData.name}</Text>
            <Text style={styles.email}>{userData.email}</Text>
            {/* Sección Favoritos */}
            <View style={styles.favSection}>
              <Text style={styles.favTitle}>Favoritos</Text>
              <Text style={styles.favEmpty}>Todavía no tienes favoritos.</Text>
            </View>
            {/* Botón de cerrar sesión */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => signOut(auth)}
            >
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    padding: 3, // Espacio extra para el borde exterior
    borderRadius: 65, // Un poco más grande que el avatar
    borderWidth: 3,
    borderColor: '#DF2892',
    marginBottom: 20,
    backgroundColor: '#181818', // Fondo para separar el borde
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
  favSection: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  favTitle: {
    color: '#DF2892',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  favEmpty: {
    color: '#aaa',
    fontSize: 16,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#DF2892',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default UserInfoScreen;