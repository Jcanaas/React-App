import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, getCurrentUser } from '../components/firebaseConfig';
import { useUser } from '../components/UserContext';

const AuthDebugger: React.FC = () => {
  const { user, loading, isAuthenticated } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const storageData = await AsyncStorage.getAllKeys();
      const authKeys = storageData.filter(key => key.includes('firebase') || key.includes('auth'));
      
      Alert.alert('Estado de Autenticación', 
        `Usuario actual: ${currentUser ? 'Logueado' : 'No logueado'}\n` +
        `Loading: ${loading}\n` +
        `IsAuthenticated: ${isAuthenticated}\n` +
        `Claves en AsyncStorage: ${authKeys.length}\n` +
        `UID: ${user?.uid || 'N/A'}`
      );
    } catch (error) {
      Alert.alert('Error', `Error verificando estado: ${error}`);
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Caché Limpiado', 'Toda la caché local ha sido eliminada');
    } catch (error) {
      Alert.alert('Error', `Error limpiando caché: ${error}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sesión Cerrada', 'Has cerrado sesión exitosamente');
    } catch (error) {
      Alert.alert('Error', `Error cerrando sesión: ${error}`);
    }
  };

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.title}>
            🐛 Auth {isExpanded ? '▼' : '▶'}
          </Text>
          <Text style={styles.miniInfo}>
            {user?.email ? '✅' : '❌'} {isAuthenticated ? 'OK' : 'NO'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.info}>Usuario: {user?.email || 'No logueado'}</Text>
            <Text style={styles.info}>Loading: {loading.toString()}</Text>
            <Text style={styles.info}>Autenticado: {isAuthenticated.toString()}</Text>
            
            <TouchableOpacity style={styles.button} onPress={checkAuthState}>
              <Text style={styles.buttonText}>Verificar Estado</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={clearCache}>
              <Text style={styles.buttonText}>Limpiar Caché</Text>
            </TouchableOpacity>
            
            {isAuthenticated && (
              <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    minWidth: 120,
    maxWidth: 200,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  miniInfo: {
    color: '#ccc',
    fontSize: 10,
  },
  expandedContent: {
    padding: 8,
    paddingTop: 4,
  },
  info: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default AuthDebugger;
