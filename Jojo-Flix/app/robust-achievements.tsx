import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface RenderAchievementProps {
  item: Achievement;
}

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'Primer Paso',
    description: 'Completa tu primera acción en la aplicación',
    category: 'beginner',
    rarity: 'common' as const,
    points: 10,
    progress: 1,
    maxProgress: 1,
    completed: true,
    icon: 'star',
  },
  {
    id: '2',
    title: 'Explorador',
    description: 'Navega por 5 pantallas diferentes',
    category: 'exploration',
    rarity: 'common' as const,
    points: 15,
    progress: 3,
    maxProgress: 5,
    completed: false,
    icon: 'explore',
  },
  {
    id: '3',
    title: 'Melómano',
    description: 'Escucha 10 canciones completas',
    category: 'music',
    rarity: 'rare' as const,
    points: 25,
    progress: 7,
    maxProgress: 10,
    completed: false,
    icon: 'music-note',
  },
  {
    id: '4',
    title: 'Crítico',
    description: 'Escribe 3 reseñas de películas',
    category: 'reviews',
    rarity: 'rare' as const,
    points: 30,
    progress: 1,
    maxProgress: 3,
    completed: false,
    icon: 'rate-review',
  },
  {
    id: '5',
    title: 'Maratonista',
    description: 'Ve 5 películas en un día',
    category: 'watching',
    rarity: 'epic' as const,
    points: 50,
    progress: 0,
    maxProgress: 5,
    completed: false,
    icon: 'movie',
  },
  {
    id: '6',
    title: 'Legendario',
    description: 'Alcanza 100 puntos totales',
    category: 'points',
    rarity: 'legendary' as const,
    points: 100,
    progress: 85,
    maxProgress: 100,
    completed: false,
    icon: 'emoji-events',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Todos', color: '#DF2892' },
  { key: 'beginner', label: 'Principiante', color: '#4CAF50' },
  { key: 'exploration', label: 'Exploración', color: '#2196F3' },
  { key: 'music', label: 'Música', color: '#FF9800' },
  { key: 'reviews', label: 'Reseñas', color: '#9C27B0' },
  { key: 'watching', label: 'Películas', color: '#F44336' },
  { key: 'points', label: 'Puntos', color: '#FFD700' },
];

const RARITY_COLORS = {
  common: '#4CAF50',
  rare: '#2196F3',
  epic: '#FF9800',
  legendary: '#9C27B0',
};

function RobustAchievements() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredAchievements = SAMPLE_ACHIEVEMENTS.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const completedCount = SAMPLE_ACHIEVEMENTS.filter(a => a.completed).length;
  const totalPoints = SAMPLE_ACHIEVEMENTS
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.points, 0);
  const progressPercentage = Math.round((completedCount / SAMPLE_ACHIEVEMENTS.length) * 100);

  const renderAchievement = ({ item }: RenderAchievementProps) => {
    const progressPercent = (item.progress / item.maxProgress) * 100;
    
    return (
      <View style={styles.achievementCard}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIcon}>
            <MaterialIcons 
              name={item.icon} 
              size={24} 
              color={item.completed ? '#4CAF50' : '#666'} 
            />
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>{item.title}</Text>
            <Text style={styles.achievementDescription}>{item.description}</Text>
            
            <View style={styles.achievementMeta}>
              <View style={styles.pointsContainer}>
                <MaterialIcons name="stars" size={16} color="#FFD700" />
                <Text style={styles.pointsText}>{item.points} pts</Text>
              </View>
              
              <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] }]}>
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.achievementStatus}>
            {item.completed ? (
              <View style={styles.completedBadge}>
                <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
              </View>
            )}
          </View>
        </View>
        
        {!item.completed && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {item.progress} / {item.maxProgress}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} 
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.statsContainer}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Logros</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="stars" size={24} color="#DF2892" />
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{progressPercentage}%</Text>
            <Text style={styles.statLabel}>Progreso</Text>
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filterTitle}>Categorías</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: selectedCategory === category.key 
                      ? category.color 
                      : '#404040'
                  }
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={[
                  styles.filterText,
                  {
                    color: selectedCategory === category.key ? '#FFF' : '#CCC'
                  }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <FlatList
        data={filteredAchievements}
        keyExtractor={item => item.id}
        renderItem={renderAchievement}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 2,
  },
  filtersSection: {
    marginTop: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  filtersContainer: {
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementCategory: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  achievementStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 8,
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  progressSection: {
    width: '100%',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 4,
  },
});

export default RobustAchievements;

