import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';

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

  // Responsive stat card width (three columns with gaps and side padding)
  const STAT_COLUMNS = 3;
  const HORIZONTAL_PADDING = 40; // 20 left + 20 right
  const GAP_TOTAL = 24; // gaps between cards
  const statCardWidth = Math.max(88, Math.floor((SCREEN_WIDTH - HORIZONTAL_PADDING - GAP_TOTAL) / STAT_COLUMNS));

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

  const renderListHeader = () => (
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
          {/* Tarjetas de estadísticas animadas */}
          <View style={styles.animatedStatsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}> 
                  <View style={styles.statIconContainer}>
                    <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
                  </View>
                  <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">Logros</Text>
                  <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">{String(completedCount)}</Text>
                </View>

              <View style={styles.statCard}> 
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(223, 40, 146, 0.15)' }]}>
                  <MaterialIcons name="stars" size={24} color="#DF2892" />
                </View>
                <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">Puntos</Text>
                <Text style={[styles.statValue, { color: '#DF2892' }]} numberOfLines={1} ellipsizeMode="tail">{String(totalPoints)}</Text>
              </View>

              <View style={styles.statCard}> 
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                  <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">Nivel</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]} numberOfLines={1} ellipsizeMode="tail">{String(currentLevel)}</Text>
              </View>
            </View>
          </View>
          
          {/* Barra de progreso general animada */}
          <View style={{ width: '100%', marginTop: 12, paddingHorizontal: 2 }}>
            <AnimatedCard
              title="Progreso General"
              subtitle={`${completedCount} de ${allAchievements.length} logros completados`}
              value={`${progressPercentage}%`}
              icon="donut-small"
              iconColor="#DF2892"
              backgroundColor="#2a2a2a"
              borderColor="#DF2892"
              layout="vertical"
              animateOnMount={true}
              delay={800}
              showProgressBar={true}
              progress={progressPercentage}
            />
          </View>

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filterTitle}>Categorías</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {categories.map((category, index) => (
                <View key={category.key} style={styles.filterButtonWrapper}>
                  <AnimatedButton
                    title={category.label}
                    onPress={() => setSelectedCategory(category.key)}
                    icon={category.icon as any}
                    iconSize={18}
                    iconColor={selectedCategory === category.key ? '#FFF' : '#b3b3b3'}
                    backgroundColor={selectedCategory === category.key ? category.color : '#404040'}
                    pressedColor={category.color}
                    animationType="bounce"
                    style={styles.animatedFilterButton}
                    textStyle={{
                      color: selectedCategory === category.key ? '#FFF' : '#b3b3b3',
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  />
                </View>
              ))}
            </ScrollView>

            <Text style={styles.filterTitle}>Rareza</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
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
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header normal de la app */}
      <Header />

      {/* Lista de logros (ahora incluye header + filtros en ListHeaderComponent) */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderListHeader}
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
                      <Text style={[styles.progressText, { color: '#FFFFFF', fontSize: 12 }]}>{String(Math.round(progress))}%</Text>
                    </View>
                  )}
                </View>
              </View>

              {!isCompleted && (
                <View style={styles.progressSection}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>
                      {String(userProgress?.currentProgress || 0)} / {String(achievement.targetValue)}
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
    width: '100%',
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
    marginBottom: 24,
    paddingVertical: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 16,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingRight: 16,
    alignItems: 'center',
  },
  filterButtonWrapper: {
    marginRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
    minWidth: 0, // Permite que el contenido se contraiga
  },
  achievementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Cambiado de 'center' a 'flex-start'
    marginBottom: 8,
    flexWrap: 'wrap', // Permite wrapping si es necesario
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 24,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    flexShrink: 0, // No se encoge
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
    flexWrap: 'wrap',
  },
  achievementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // Permite wrapping en pantallas pequeñas
    gap: 8, // Espaciado entre elementos
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
    flexShrink: 0, // No se encoge
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#b3b3b3',
    marginLeft: 4,
    flexShrink: 0, // No se encoge
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
  animatedStatsContainer: {
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    flex: 1,
    flexBasis: 0,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#444',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    minWidth: 92,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  animatedFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 100,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});