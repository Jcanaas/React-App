import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import { Achievement, UserAchievementProgress } from '../services/RobustAchievementService';
import { AchievementType, AchievementCategory } from '../services/AchievementService';
import { useRobustGamification } from '../contexts/RobustGamificationContext';
import AchievementBadge from './AchievementBadge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievement: Achievement;
  userAchievement: UserAchievementProgress;
  onDismiss: () => void;
  onViewDetails: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  userAchievement,
  onDismiss,
  onViewDetails
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Función para obtener color basado en rarity del sistema robusto
  const getCategoryColor = () => {
    switch (achievement.rarity) {
      case 'common':
        return '#4CAF50';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#FF9800';
      case 'legendary':
        return '#9C27B0';
      default:
        return '#4CAF50';
    }
  };

  // Adaptador para convertir UserAchievementProgress a UserAchievement
  const adaptedUserProgress = {
    id: userAchievement.id,
    userId: userAchievement.userId,
    isUnlocked: userAchievement.isCompleted,
    progress: (userAchievement.currentProgress / userAchievement.targetProgress) * 100,
    achievementId: userAchievement.achievementId,
    unlockedAt: userAchievement.completedAt,
    currentValue: userAchievement.currentProgress,
    targetValue: userAchievement.targetProgress
  };

  // Adaptador para Achievement del sistema robusto al sistema de badges
  const getOldAchievementType = (): AchievementType => {
    switch (achievement.category) {
      case 'reviews':
        return AchievementType.REVIEWS;
      case 'social':
        return AchievementType.SOCIAL;
      case 'music':
        return AchievementType.MUSIC_TIME;
      case 'time':
        return AchievementType.APP_TIME;
      default:
        return AchievementType.SPECIAL;
    }
  };

  const getOldAchievementCategory = (): AchievementCategory => {
    switch (achievement.rarity) {
      case 'common':
        return AchievementCategory.BEGINNER;
      case 'rare':
        return AchievementCategory.INTERMEDIATE;
      case 'epic':
        return AchievementCategory.ADVANCED;
      case 'legendary':
        return AchievementCategory.EXPERT;
      default:
        return AchievementCategory.BEGINNER;
    }
  };

  const adaptedAchievement = {
    ...achievement,
    type: getOldAchievementType(),
    category: getOldAchievementCategory(),
    requirement: achievement.targetValue,
    color: getCategoryColor()
  };

  useEffect(() => {
    // Reproducir sonido de logro
    playAchievementSound();

    // Animación de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Animación de estrellas
      Animated.timing(starAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Auto-dismiss después de 5 segundos
    const timeout = setTimeout(() => {
      dismissNotification();
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      pulseAnimation.stop();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playAchievementSound = async () => {
    try {
      // Usar un sonido del sistema o crear uno simple
      const { sound: achievementSound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsbAT2H0fPTgjEGHXnE7+OZURE+m9v0w3AkBSl+zPLaizsIE2mt6+OZTgwKW7bt3qkOdcnzz3ksBTF-' }, 
        { shouldPlay: true, volume: 0.3 }
      );
      setSound(achievementSound);
    } catch (error) {
      console.log('No se pudo reproducir el sonido de logro:', error);
    }
  };

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const categoryColor = getCategoryColor();

  // Partículas de estrellas animadas
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * (Math.PI / 180); // 45 grados entre cada estrella
      const distance = 80;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      stars.push(
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              transform: [
                {
                  translateX: starAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, x],
                  }),
                },
                {
                  translateY: starAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, y],
                  }),
                },
                {
                  scale: starAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons name="star" size={12} color="#FFD700" />
        </Animated.View>
      );
    }
    return stars;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      
      {/* Contenedor principal */}
      <View style={[styles.notificationCard, { borderLeftColor: categoryColor }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="celebration" size={20} color={categoryColor} />
            <Text style={styles.headerText}>¡Logro Desbloqueado!</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={dismissNotification}
          >
            <MaterialIcons name="close" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          
          {/* Badge del logro con animación */}
          <View style={styles.badgeContainer}>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <AchievementBadge
                achievement={adaptedAchievement}
                userProgress={adaptedUserProgress}
                size="large"
                showProgress={false}
              />
            </Animated.View>
            
            {/* Estrellas animadas */}
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
          </View>

          {/* Información del logro */}
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>
            
            <View style={styles.pointsContainer}>
              <MaterialIcons name="stars" size={16} color="#FFD700" />
              <Text style={styles.pointsText}>+{achievement.points} puntos</Text>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={dismissNotification}
          >
            <Text style={styles.actionButtonText}>Cerrar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton, { backgroundColor: categoryColor }]}
            onPress={() => {
              onViewDetails();
              dismissNotification();
            }}
          >
            <Text style={styles.primaryActionButtonText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Componente manejador de notificaciones
export const AchievementNotificationManager: React.FC = () => {
  const { 
    pendingNotifications, 
    markNotificationAsShown, 
    getAchievementById 
  } = useRobustGamification();
  
  const [currentNotification, setCurrentNotification] = useState<UserAchievementProgress | null>(null);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    // Debug: verificar notificaciones pendientes
    console.log('🔔 [NOTIFICATIONS] Notificaciones pendientes:', pendingNotifications.length);
    
    // Mostrar la primera notificación pendiente
    if (pendingNotifications.length > 0 && !currentNotification) {
      const notification = pendingNotifications[0];
      const achievement = getAchievementById(notification.achievementId);
      
      console.log('📢 [NOTIFICATIONS] Mostrando notificación:', notification.achievementId);
      console.log('🏆 [NOTIFICATIONS] Logro encontrado:', achievement?.title);
      
      if (achievement) {
        setCurrentNotification(notification);
        setCurrentAchievement(achievement);
      }
    }
  }, [pendingNotifications, currentNotification]);

  const handleDismiss = async () => {
    if (currentNotification) {
      await markNotificationAsShown(currentNotification.achievementId);
      setCurrentNotification(null);
      setCurrentAchievement(null);
    }
  };

  const handleViewDetails = () => {
    // Aquí podrías abrir un modal con más detalles o navegar a la pantalla de logros
    console.log('Ver detalles del logro:', currentAchievement?.id);
    handleDismiss();
  };

  if (!currentNotification || !currentAchievement) {
    return null;
  }

  return (
    <AchievementNotification
      achievement={currentAchievement}
      userAchievement={currentNotification}
      onDismiss={handleDismiss}
      onViewDetails={handleViewDetails}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
  },
  badgeContainer: {
    position: 'relative',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
  },
  achievementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
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
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#1976D2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default AchievementNotificationManager;