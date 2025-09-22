import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRobustGamification } from '../contexts/RobustGamificationContext';
import { auth } from '../components/firebaseConfig';
import { useRouter } from 'expo-router';
import Header from '../components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AchievementsScreen() {
  const router = useRouter();
  const {
    userProgress,
    userAchievements,
    achievementSummary,
    allAchievements,
    isLoading,
    isInitialized,
    totalPoints,
    completionPercentage,
    recentAchievements,
    upcomingAchievements,
    refreshAllData,
    forceInitialization,
    syncOnAchievementsView,
    getAchievementDefinition
  } = useRobustGamification();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // Sincronizar SOLO una vez al entrar a la pantalla
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid && !isInitialized) {
      console.log('🏆 [MOUNT] Primera carga de logros - leyendo BD una vez');
      syncOnAchievementsView();
    }
  }, []); // Solo al montar, no dependencies que causen bucles

  useEffect(() => {
    console.log('🏆 [ACHIEVEMENTS SCREEN] Estado inicial:', {
      isLoading,
      isInitialized,
      userAchievementsCount: userAchievements?.length,
      allAchievementsCount: allAchievements?.length,
      totalPoints,
      completionPercentage
    });

    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, isInitialized, userAchievements, allAchievements]);

  // Categorías con iconos y colores
  const categories = [
    { key: 'all', label: 'Todos', icon: 'apps', color: '#DF2892' },
    { key: 'reviews', label: 'Reseñas', icon: 'rate-review', color: '#FF6B6B' },
    { key: 'social', label: 'Social', icon: 'people', color: '#4ECDC4' },
    { key: 'music', label: 'Música', icon: 'music-note', color: '#45B7D1' },
    { key: 'time', label: 'Tiempo', icon: 'access-time', color: '#96CEB4' }
  ];

  const rarities = [
    { key: 'all', label: 'Todas', color: '#DF2892' },
    { key: 'common', label: 'Común', color: '#4CAF50' },
    { key: 'rare', label: 'Raro', color: '#2196F3' },
    { key: 'epic', label: 'Épico', color: '#FF9800' },
    { key: 'legendary', label: 'Legendario', color: '#9C27B0' }
  ];

  // Filtrar logros
  const filteredAchievements = allAchievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || achievement.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  // Obtener progreso del usuario para cada logro
  const getAchievementProgress = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievementId === achievementId);
  };

  // Función de refresco
  const onRefresh = async () => {
    console.log('🔄 [ACHIEVEMENTS SCREEN] Iniciando refresh...');
    setRefreshing(true);
    try {
      await refreshAllData();
      console.log('✅ [ACHIEVEMENTS SCREEN] Refresh completado');
    } catch (error) {
      console.error('❌ [ACHIEVEMENTS SCREEN] Error refreshing:', error);
    }
    setRefreshing(false);
  };

  // Calcular estadísticas
  const completedCount = userAchievements.filter(ua => ua.isCompleted).length;
  const progressPercentage = Math.round(completionPercentage);
  const currentLevel = Math.floor(totalPoints / 1000) + 1;
  const pointsForNextLevel = 1000 - (totalPoints % 1000);

  if (isLoading && !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF2892" />
        <Text style={styles.loadingText}>Cargando logros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header normal de la app */}
      <Header />
      
      {/* Header con estadísticas */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedCount}</Text>
                <Text style={styles.statLabel}>Logros</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Puntos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentLevel}</Text>
                <Text style={styles.statLabel}>Nivel</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>Progreso General</Text>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categorías</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedCategory === category.key 
                    ? category.color 
                    : '#404040' 
                }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <MaterialIcons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.key ? '#FFF' : '#b3b3b3'} 
              />
              <Text style={[
                styles.filterText,
                { 
                  color: selectedCategory === category.key ? '#FFF' : '#b3b3b3' 
                }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Rareza</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {rarities.map((rarity) => (
            <TouchableOpacity
              key={rarity.key}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedRarity === rarity.key 
                    ? rarity.color 
                    : '#404040' 
                }
              ]}
              onPress={() => setSelectedRarity(rarity.key)}
            >
              <Text style={[
                styles.filterText,
                { 
                  color: selectedRarity === rarity.key ? '#FFF' : '#b3b3b3' 
                }
              ]}>
                {rarity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de logros */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: achievement }) => {
          const userProgress = getAchievementProgress(achievement.id);
          const progress = userProgress 
            ? (userProgress.currentProgress / userProgress.targetProgress) * 100 
            : 0;
          const isCompleted = userProgress?.isCompleted || false;

          return (
            <TouchableOpacity style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementTitleRow}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <View style={[
                      styles.rarityBadge,
                      { backgroundColor: rarities.find(r => r.key === achievement.rarity)?.color }
                    ]}>
                      <Text style={styles.rarityText}>{achievement.rarity}</Text>
                    </View>
                  </View>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <View style={styles.achievementMeta}>
                    <View style={styles.pointsContainer}>
                      <MaterialIcons name="stars" size={16} color="#FFD700" />
                      <Text style={styles.pointsText}>{achievement.points} puntos</Text>
                    </View>
                    <View style={styles.categoryContainer}>
                      <MaterialIcons 
                        name={categories.find(c => c.key === achievement.category)?.icon as any} 
                        size={16} 
                        color="#666" 
                      />
                      <Text style={styles.categoryText}>
                        {categories.find(c => c.key === achievement.category)?.label}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.achievementStatus}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
                    </View>
                  ) : (
                    <View style={styles.progressCircle}>
                      <Text style={[styles.progressText, { color: '#FFFFFF', fontSize: 12 }]}>{Math.round(progress)}%</Text>
                    </View>
                  )}
                </View>
              </View>

              {!isCompleted && (
                <View style={styles.progressSection}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>
                      {userProgress?.currentProgress || 0} / {achievement.targetValue}
                    </Text>
                  </View>
                  <View style={styles.achievementProgressBar}>
                    <View 
                      style={[
                        styles.achievementProgressFill, 
                        { width: `${progress}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        style={styles.achievementsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DF2892',
    borderRadius: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 16,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  achievementsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  achievementCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  achievementInfo: {
    flex: 1,
    marginRight: 16,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  rarityText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#b3b3b3',
    lineHeight: 20,
    marginBottom: 12,
  },
  achievementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    color: '#DF2892',
    marginLeft: 4,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#b3b3b3',
    marginLeft: 4,
  },
  achievementStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#757575',
  },
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  progressLabel: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 8,
  },
  achievementProgressBar: {
    height: 6,
    backgroundColor: '#404040',
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#DF2892',
    borderRadius: 3,
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DF2892',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});