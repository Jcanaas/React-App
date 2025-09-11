import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import SimpleActorService, { SimpleActorPhoto } from '../services/SimpleActorService';

interface SimpleOMDbCastProps {
  cast?: string;
}

const SimpleOMDbCast: React.FC<SimpleOMDbCastProps> = ({ cast }) => {
  const [actors, setActors] = useState<SimpleActorPhoto[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const screenWidth = Dimensions.get('window').width;
  const actorService = SimpleActorService.getInstance();

  useEffect(() => {
    if (cast && cast !== 'N/A') {
      const actorNames = cast.split(',').map(name => name.trim()).slice(0, 15);
      const actorAvatars = actorService.getMultipleActorAvatars(actorNames);
      setActors(actorAvatars);
      setImageErrors(new Set()); // Reset errors when cast changes
    }
  }, [cast]);

  const handleImageError = (actorName: string) => {
    setImageErrors(prev => new Set(prev).add(actorName));
  };

  const getImageSource = (actor: SimpleActorPhoto) => {
    if (imageErrors.has(actor.name)) {
      // Si la imagen falló, usar el data URL backup
      return { uri: actorService.generateDataURLAvatar(actor.initials, actor.backgroundColor) };
    }
    return { uri: actor.profilePath };
  };

  if (!cast || cast === 'N/A' || actors.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Reparto</Text>
        <Text style={styles.noDataText}>No hay información del reparto disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reparto Principal</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {actors.map((actor, index) => (
          <View key={`${actor.name}-${index}`} style={styles.actorCard}>
            <View style={styles.imageContainer}>
              <Image
                source={getImageSource(actor)}
                style={styles.actorImage}
                onError={() => handleImageError(actor.name)}
                defaultSource={{ uri: actorService.generateDataURLAvatar(actor.initials, actor.backgroundColor) }}
              />
              
              {/* Badge con iniciales como backup visual */}
              <View 
                style={[
                  styles.initialsBadge, 
                  { backgroundColor: `#${actor.backgroundColor}` }
                ]}
              >
                <Text style={styles.initialsText}>{actor.initials}</Text>
              </View>
            </View>
            
            <Text style={styles.actorName} numberOfLines={2}>
              {actor.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  scrollView: {
    paddingHorizontal: 8,
  },
  scrollContainer: {
    paddingHorizontal: 8,
  },
  actorCard: {
    alignItems: 'center',
    marginHorizontal: 6,
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
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  initialsBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  initialsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actorName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 90,
  },
});

export default SimpleOMDbCast;
