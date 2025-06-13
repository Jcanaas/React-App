import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, deleteField } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Añade y exporta la instancia de Firestore:
export const db = getFirestore(app);