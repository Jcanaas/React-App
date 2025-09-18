import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth/react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCAbt9D5lmZV3MSygsK-IgkHQP9V3nPohU",
  authDomain: "jojo-flix.firebaseapp.com",
  databaseURL: "https://jojo-flix-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jojo-flix",
  storageBucket: "jojo-flix.appspot.com",
  messagingSenderId: "1035423966066",
  appId: "1:1035423966066:web:033b482b97d0ab5d13b3eb",
  measurementId: "G-SCH4DH1QDF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar Auth con persistencia mejorada
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Solo para desarrollo: conectar al emulador si está disponible
// if (__DEV__) {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099');
//   } catch (error) {
//     console.log('Auth emulator no disponible');
//   }
// }

// Configurar Firestore
export const db = getFirestore(app);

// Función para verificar el estado de autenticación
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Log para debugging
console.log('Firebase configurado correctamente');
console.log('Auth persistence configurado con AsyncStorage');