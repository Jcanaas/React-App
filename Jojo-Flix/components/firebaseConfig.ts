import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);