import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../components/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';
import { doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Estado para el nombre
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Estado para saber si el teclado está abierto
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [logoPressCount, setLogoPressCount] = useState(0);
  const [gyroActive, setGyroActive] = useState(false);
  const cardAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const router = useRouter(); // <--- AGREGA ESTA LÍNEA

  // Giroscopio
  useEffect(() => {
    let subscription: any;
    if (gyroActive) {
      subscription = Gyroscope.addListener(gyroscopeData => {
        // ¡Hazlo más exagerado!
        Animated.spring(cardAnim, {
          toValue: {
            x: gyroscopeData.y * 300, // Aumenta el multiplicador para más movimiento
            y: gyroscopeData.x * 300,
          },
          useNativeDriver: true,
          speed: 10,
          bounciness: 90,
        }).start();
      });
      Gyroscope.setUpdateInterval(90); // Más fluido (60fps)
    } else {
      // Vuelve al centro cuando se desactiva
      Animated.spring(cardAnim, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
      if (subscription) subscription.remove();
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, [gyroActive]);

  // Logo tap: activa/desactiva el giroscopio cada 3 toques
  const onLogoPress = () => {
    setLogoPressCount(count => {
      if (count + 1 >= 3) {
        setGyroActive(active => !active);
        return 0; // reinicia el contador
      }
      return count + 1;
    });
  };

  // Simple animated glow for the button
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleAuth = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      if (isRegister) {
        // 1. Crea el usuario en Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Imagen de perfil por defecto
        const defaultProfileImage = 'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_pink.png';
        // 3. Guarda el usuario en Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          uid: userCredential.user.uid,
          profileImage: defaultProfileImage,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.replace('/');
      }, 1000); // Espera 1 segundo antes de redirigir
      return;
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Carga la fuente antes de renderizar
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../assets/fonts/BN.ttf'),
  });

  if (!fontsLoaded) return null; // Espera a que la fuente esté lista

  const isWeb = Platform.OS === 'web';

  return (
    <LinearGradient
      colors={['#FF7EB3', '#DF2892', '#18181b']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }} // Asegúrate de que ocupe todo el alto
    >
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 10} 
      >
        <Animated.View
          style={{
            transform: [
              { translateX: cardAnim.x },
              { translateY: cardAnim.y },
            ],
            width: '100%',
            alignItems: 'center',
          }}
        >
          <BlurView
            intensity={18}
            tint="dark"
            style={styles.card}
          >
            <TouchableOpacity onPress={onLogoPress} style={styles.logoContainer} activeOpacity={1}>
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
            <Text style={styles.title}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
            {/* <Text style={styles.subtitle}>Bienvenido a Jojo-Flix</Text> */}
            {success && (
              <View style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>
                  ¡Autenticación exitosa!
                </Text>
              </View>
            )}
            {isRegister && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#fff" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#aaa"
                />
              </View>
            )}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Correo"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#aaa"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#aaa" />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={{ marginRight: 8, transform: [{ rotate: glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                    <Ionicons name="reload" size={18} color="#fff" />
                  </Animated.View>
                  <Text style={styles.buttonText}>Cargando...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>{isRegister ? 'Registrarse' : 'Entrar'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.toggle}>
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    backgroundColor: 'rgba(24,24,27,0.75)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#DF2892',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: 140,
    height: 48,
  },
  logoText: {
    fontFamily: 'Bebas Neue',
    fontSize: 40,
    letterSpacing: 2,
    color: 'black',
    fontWeight: 'normal',
    includeFontPadding: false,
    textAlign: 'center',
    width: 140,
    height: 48,
    lineHeight: 48,
  },
  gradient: {
    width: 140,
    height: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    color: '#DF2892', // Cambiado a rosa
    marginBottom: 18,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 6,
  },
  error: {
    color: '#f87171',
    marginBottom: 8,
    marginTop: -6,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#DF2892', // Cambiado a rosa
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 6,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#DF2892', // Cambiado a rosa
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggle: {
    color: '#DF2892', // Cambiado a rosa
    marginTop: 10,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});