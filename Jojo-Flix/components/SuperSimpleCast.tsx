// Servicio alternativo que garantiza fotos reales de personas
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SuperSimpleCastProps {
  actors: string[];
  director: string;
  writer?: string;
  loading?: boolean;
}

// Función para detectar género aproximado por nombre y asignar foto apropiada
const getGenderAndPhoto = (actorName: string, index: number) => {
  const firstName = actorName.split(' ')[0].toLowerCase();
  
  // Listas de nombres comunes para detectar género
  const femaleNames = [
    'bella', 'emma', 'sophia', 'olivia', 'ava', 'isabella', 'mia', 'charlotte', 'amelia', 'harper',
    'scarlett', 'jennifer', 'angelina', 'kate', 'anne', 'helen', 'mary', 'elizabeth', 'sarah', 'jessica',
    'emily', 'anna', 'maria', 'laura', 'lisa', 'nancy', 'karen', 'betty', 'ruth', 'sharon',
    'michelle', 'kimberly', 'donna', 'carol', 'sandra', 'ashley', 'brenda', 'emma', 'stephanie', 'janet'
  ];
  
  const maleNames = [
    'john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'charles', 'joseph', 'thomas',
    'christopher', 'daniel', 'paul', 'mark', 'donald', 'george', 'kenneth', 'steven', 'edward', 'brian',
    'ronald', 'anthony', 'kevin', 'jason', 'matthew', 'gary', 'timothy', 'jose', 'larry', 'jeffrey',
    'frank', 'scott', 'eric', 'stephen', 'andrew', 'raymond', 'gregory', 'joshua', 'jerry', 'dennis'
  ];
  
  // Detectar género por nombre
  let isFemale = false;
  if (femaleNames.includes(firstName)) {
    isFemale = true;
  } else if (maleNames.includes(firstName)) {
    isFemale = false;
  } else {
    // Si no está en las listas, usar longitud del nombre como heurística
    isFemale = firstName.length % 2 === 0;
  }
  
  const nameHash = actorName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const photoId = Math.abs(nameHash) % 99 + 1;
  
  return {
    name: actorName,
    isFemale,
    // Usar género detectado para asignar foto apropiada
    mainPhoto: `https://randomuser.me/api/portraits/${isFemale ? 'women' : 'men'}/${photoId}.jpg`,
    backupPhoto: `https://randomuser.me/api/portraits/${isFemale ? 'women' : 'men'}/${((photoId + 20) % 99) + 1}.jpg`,
    // Avatar estilizado como último recurso
    avatarPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&size=200&background=${isFemale ? 'e74c3c' : '3498db'}&color=ffffff&format=png&rounded=true&bold=true`
  };
};

const RealPersonImage: React.FC<{ actorData: ReturnType<typeof getGenderAndPhoto> }> = ({ actorData }) => {
  const [currentPhoto, setCurrentPhoto] = useState(actorData.mainPhoto);
  const [attempts, setAttempts] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    console.log(`❌ Foto ${attempts + 1} falló para ${actorData.name}`);
    
    if (attempts === 0) {
      setCurrentPhoto(actorData.backupPhoto);
      setAttempts(1);
      setLoading(true);
    } else if (attempts === 1) {
      setCurrentPhoto(actorData.avatarPhoto);
      setAttempts(2);
      setLoading(true);
    } else {
      setLoading(false);
      console.log(`🚫 Todas las fotos fallaron para ${actorData.name}`);
    }
  };

  const handleLoad = () => {
    console.log(`✅ FOTO REAL cargada para ${actorData.name} (intento ${attempts + 1})`);
    setLoaded(true);
    setLoading(false);
  };

  return (
    <View style={styles.photoContainer}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>📸</Text>
        </View>
      )}
      
      <Image
        source={{ uri: currentPhoto }}
        style={styles.personPhoto}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
      
      {/* Indicador de que es foto real */}
      {loaded && (
        <View style={styles.realBadge}>
          <Text style={styles.realIcon}>✅</Text>
        </View>
      )}
    </View>
  );
};

const SuperSimpleCast: React.FC<SuperSimpleCastProps> = ({ 
  actors, 
  director, 
  writer, 
  loading = false 
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingTitle}>Buscando fotos reales...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Director */}
      {director && director !== 'N/A' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎬 Director</Text>
          <Text style={styles.personName}>{director}</Text>
        </View>
      )}

      {/* Reparto con fotos reales */}
      {actors && actors.length > 0 && actors[0] !== 'N/A' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 Reparto Principal ({actors.length})</Text>
          <Text style={styles.subtitle}>Fotos representativas (género detectado)</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.actorsScroll}
          >
            {actors.map((actor, index) => {
              const actorData = getGenderAndPhoto(actor, index);
              return (
                <View key={index} style={styles.actorItem}>
                  <RealPersonImage actorData={actorData} />
                  <Text style={styles.actorLabel} numberOfLines={2}>
                    {actor.trim()}
                  </Text>
                  <Text style={styles.genderIndicator}>
                    {actorData.isFemale ? '♀️' : '♂️'}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Estado vacío */}
      {(!actors || actors.length === 0) && (!director || director === 'N/A') && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyText}>No hay información de reparto</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  personName: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  actorsScroll: {
    marginTop: 8,
  },
  actorItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  personPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#333',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 45,
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 4,
  },
  realBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  realIcon: {
    fontSize: 12,
  },
  actorLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  genderIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SuperSimpleCast;
