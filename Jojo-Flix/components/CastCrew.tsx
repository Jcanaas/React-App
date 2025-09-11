import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TMDBCredits } from '../services/TMDBService';
import tmdbService from '../services/TMDBService';

interface CastCrewProps {
  credits: TMDBCredits | null;
  onPersonPress?: (personId: number, personName: string) => void;
  maxCastMembers?: number;
  maxCrewMembers?: number;
}

const CastCrew: React.FC<CastCrewProps> = memo(({ 
  credits, 
  onPersonPress,
  maxCastMembers = 10,
  maxCrewMembers = 5
}) => {
  if (!credits) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="people" size={40} color="#666" />
        <Text style={styles.emptyText}>Información de reparto no disponible</Text>
      </View>
    );
  }

  const mainCast = credits.cast.slice(0, maxCastMembers);
  const mainCrew = credits.crew
    .filter(member => ['Director', 'Writer', 'Producer', 'Executive Producer'].includes(member.job))
    .slice(0, maxCrewMembers);

  const renderPerson = (person: any, role: string, isCrewMember: boolean = false) => (
    <TouchableOpacity
      key={`${person.id}-${person.credit_id}`}
      style={styles.personCard}
      onPress={() => onPersonPress?.(person.id, person.name)}
      activeOpacity={0.7}
    >
      <View style={styles.personImageContainer}>
        {person.profile_path ? (
          <Image
            source={{ uri: tmdbService.getImageUrl(person.profile_path, 'w185') || '' }}
            style={styles.personImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.personImagePlaceholder}>
            <MaterialIcons name="person" size={30} color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.personInfo}>
        <Text style={styles.personName} numberOfLines={2}>
          {person.name}
        </Text>
        <Text style={styles.personRole} numberOfLines={2}>
          {role}
        </Text>
        {person.character && !isCrewMember && (
          <Text style={styles.characterName} numberOfLines={1}>
            "{person.character}"
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Reparto Principal */}
      {mainCast.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={24} color="#DF2892" />
            <Text style={styles.sectionTitle}>Reparto Principal</Text>
            {credits.cast.length > maxCastMembers && (
              <Text style={styles.sectionCount}>
                ({credits.cast.length} en total)
              </Text>
            )}
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {mainCast.map(actor => renderPerson(actor, actor.character || 'Actor'))}
          </ScrollView>
        </View>
      )}

      {/* Equipo Técnico */}
      {mainCrew.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="work" size={24} color="#DF2892" />
            <Text style={styles.sectionTitle}>Equipo Técnico</Text>
            {credits.crew.length > maxCrewMembers && (
              <Text style={styles.sectionCount}>
                ({credits.crew.length} en total)
              </Text>
            )}
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {mainCrew.map(crewMember => renderPerson(crewMember, crewMember.job, true))}
          </ScrollView>
        </View>
      )}

      {/* Estadísticas del reparto */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{credits.cast.length}</Text>
          <Text style={styles.statLabel}>Actores</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{credits.crew.length}</Text>
          <Text style={styles.statLabel}>Equipo</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {credits.crew.filter(c => c.job === 'Director').length}
          </Text>
          <Text style={styles.statLabel}>Directores</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    color: '#888',
    fontSize: 14,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  personCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  personImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#333',
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  personImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444',
  },
  personInfo: {
    padding: 8,
  },
  personName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  personRole: {
    color: '#DF2892',
    fontSize: 12,
    marginBottom: 2,
  },
  characterName: {
    color: '#ccc',
    fontSize: 11,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#DF2892',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#444',
    marginHorizontal: 16,
  },
});

CastCrew.displayName = 'CastCrew';

export default CastCrew;
