import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebaseConfig';

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('UserProvider: Inicializando listener de autenticación');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('UserProvider: Estado de autenticación cambió:', firebaseUser ? 'Usuario logueado' : 'Usuario no logueado');
      
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setLoading(false);
    });

    return () => {
      console.log('UserProvider: Limpiando listener de autenticación');
      unsubscribe();
    };
  }, []);

  const contextValue = {
    user,
    loading,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};