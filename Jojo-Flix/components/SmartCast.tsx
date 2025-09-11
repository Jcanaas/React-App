// Componente de reparto con avatares apropiados por género y nombre
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SmartCastProps {
  actors: string[];
  director: string;
  writer?: string;
  loading?: boolean;
}

// Función que detecta género y crea avatares apropiados
const createSmartAvatar = (actorName: string, index: number) => {
  const firstName = actorName.split(' ')[0].toLowerCase();
  
  // Listas más completas de nombres
  const femaleNames = [
    'bella', 'emma', 'sophia', 'olivia', 'ava', 'isabella', 'mia', 'charlotte', 'amelia', 'harper',
    'scarlett', 'jennifer', 'angelina', 'kate', 'anne', 'helen', 'mary', 'elizabeth', 'sarah', 'jessica',
    'emily', 'anna', 'maria', 'laura', 'lisa', 'nancy', 'karen', 'betty', 'ruth', 'sharon', 'arya',
    'sansa', 'daenerys', 'cersei', 'margaery', 'ygritte', 'melisandre', 'brienne', 'catelyn', 'lyanna'
  ];
  
  const maleNames = [
    'john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'charles', 'joseph', 'thomas',
    'christopher', 'daniel', 'paul', 'mark', 'donald', 'george', 'kenneth', 'steven', 'edward', 'brian',
    'jon', 'tyrion', 'jaime', 'ned', 'robb', 'bran', 'theon', 'samwell', 'jorah', 'tywin', 'peter',
    'leonardo', 'brad', 'tom', 'will', 'chris', 'robert', 'ryan', 'matt', 'johnny', 'sean'
  ];
  
  // Detectar género
  let isFemale = false;
  if (femaleNames.some(name => firstName.includes(name) || name.includes(firstName))) {
    isFemale = true;
  } else if (maleNames.some(name => firstName.includes(name) || name.includes(firstName))) {
    isFemale = false;
  } else {
    // Heurística por terminaciones comunes
    if (firstName.endsWith('a') || firstName.endsWith('e') || firstName.endsWith('ia')) {
      isFemale = true;
    } else {
      isFemale = false;
    }
  }
  
  const initials = actorName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  // Colores por género
  const femaleColors = ['e74c3c', 'e91e63', '9c27b0', '673ab7', '3f51b5', 'ff5722'];
  const maleColors = ['3498db', '2196f3', '00bcd4', '009688', '4caf50', '607d8b'];
  
  const colors = isFemale ? femaleColors : maleColors;
  const colorIndex = Math.abs(actorName.charCodeAt(0)) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return {
    name: actorName,
    initials,
    isFemale,
    backgroundColor,
    // Avatares estilizados por género
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${backgroundColor}&color=ffffff&format=png&rounded=true&bold=true&font-size=0.6`,
    
    // Avatar alternativo con estilo diferente
    backupUrl: `https://api.dicebear.com/7.x/${isFemale ? 'avataaars' : 'male'}/png?seed=${encodeURIComponent(actorName)}&size=200&backgroundColor=${backgroundColor}`,
    
    // Emoji representativo
    genderEmoji: isFemale ? '👩' : '👨'
  };
};

const SmartActorImage: React.FC<{ 
  actorData: ReturnType<typeof createSmartAvatar> 
}> = ({ actorData }) => {
  const [imageUrl, setImageUrl] = useState(actorData.avatarUrl);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleImageError = () => {
    if (imageUrl === actorData.avatarUrl) {
      setImageUrl(actorData.backupUrl);
      setLoading(true);
    } else {
      setFailed(true);
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setFailed(false);
  };

  return (
    <View style={styles.imageContainer}>
      {!failed ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.actorImage, { borderColor: `#${actorData.backgroundColor}` }]}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </>
      ) : (
        // Fallback con iniciales y emoji
        <View style={[styles.fallbackAvatar, { backgroundColor: `#${actorData.backgroundColor}` }]}>
          <Text style={styles.fallbackEmoji}>{actorData.genderEmoji}</Text>
          <Text style={styles.fallbackInitials}>{actorData.initials}</Text>
        </View>
      )}
      
      {/* Indicador de género */}
      <View style={[styles.genderBadge, { backgroundColor: `#${actorData.backgroundColor}` }]}>
        <Text style={styles.genderIcon}>{actorData.genderEmoji}</Text>
      </View>
    </View>
  );
};

const SmartCast: React.FC<SmartCastProps> = ({ 
  actors, 
  director, 
  writer, 
  loading = false 
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingTitle}>Preparando reparto...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Director */}
      {director && director !== 'N/A' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="movie" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Director</Text>
          </View>
          <Text style={styles.personName}>{director}</Text>
        </View>
      )}

      {/* Reparto */}
      {actors && actors.length > 0 && actors[0] !== 'N/A' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Reparto Principal</Text>
            <Text style={styles.actorCount}>({actors.length})</Text>
          </View>
          
          <Text style={styles.subtitle}>Avatares personalizados por género detectado</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.actorsScroll}
            contentContainerStyle={styles.actorsScrollContent}
          >
            {actors.map((actor, index) => {
              const actorData = createSmartAvatar(actor, index);
              return (
                <View key={index} style={styles.actorCard}>
                  <SmartActorImage actorData={actorData} />
                  <Text style={styles.actorName} numberOfLines={2}>
                    {actor.trim()}
                  </Text>
                  <View style={styles.genderRow}>
                    <Text style={styles.genderLabel}>
                      {actorData.isFemale ? 'Femenino' : 'Masculino'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Estado vacío */}
      {(!actors || actors.length === 0) && (!director || director === 'N/A') && (
        <View style={styles.emptyState}>
          <MaterialIcons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No hay información de reparto disponible</Text>
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
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actorCount: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 8,
  },
  subtitle: {
    color: '#999',
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
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  actorsScroll: {
    marginTop: 8,
  },
  actorsScrollContent: {
    paddingRight: 16,
  },
  actorCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  actorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    borderWidth: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
  },
  fallbackAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  fallbackEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  fallbackInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  genderBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  genderIcon: {
    fontSize: 12,
  },
  actorName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 4,
  },
  genderRow: {
    alignItems: 'center',
  },
  genderLabel: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SmartCast;
