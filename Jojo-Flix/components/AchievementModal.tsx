import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Achievement, UserAchievement, AchievementCategory } from '../services/AchievementService';
import AchievementBadge from './AchievementBadge';

interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  userProgress?: UserAchievement;
  onClose: () => void;
  onCelebrate?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AchievementModal: React.FC<AchievementModalProps> = ({
  visible,
  achievement,
  userProgress,
  onClose,
  onCelebrate
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
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
      ]).start();
    } else {
      // Animación de salida
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!achievement) return null;

  const isUnlocked = userProgress?.isUnlocked || false;
  const progress = userProgress?.progress || 0;
  const progressPercentage = Math.min((progress / achievement.requirement) * 100, 100);

  const getCategoryText = () => {
    switch (achievement.category) {
      case AchievementCategory.BEGINNER:
        return 'Principiante';
      case AchievementCategory.INTERMEDIATE:
        return 'Intermedio';
      case AchievementCategory.ADVANCED:
        return 'Avanzado';
      case AchievementCategory.EXPERT:
        return 'Experto';
      case AchievementCategory.LEGENDARY:
        return 'Legendario';
      default:
        return 'Común';
    }
  };

  const getCategoryColor = () => {
    switch (achievement.category) {
      case AchievementCategory.BEGINNER:
        return '#DF2892';
      case AchievementCategory.INTERMEDIATE:
        return '#E91E63';
      case AchievementCategory.ADVANCED:
        return '#FF1744';
      case AchievementCategory.EXPERT:
        return '#FF6B35';
      case AchievementCategory.LEGENDARY:
        return '#9C27B0';
      default:
        return '#DF2892';
    }
  };

  const categoryColor = achievement.color || getCategoryColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: opacityAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdrop} 
            onPress={onClose}
            activeOpacity={1}
          />
          
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Insignia del logro */}
              <View style={styles.badgeContainer}>
                <AchievementBadge
                  achievement={achievement}
                  userProgress={userProgress}
                  size="large"
                  showProgress={false}
                />
              </View>

              {/* Título y descripción */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{achievement.title}</Text>
                <Text style={styles.description}>{achievement.description}</Text>
              </View>

              {/* Categoría y puntos */}
              <View style={styles.infoContainer}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                  <Text style={styles.categoryText}>{getCategoryText()}</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <MaterialIcons name="stars" size={16} color="#FFD700" />
                  <Text style={styles.pointsText}>{achievement.points} puntos</Text>
                </View>
              </View>

              {/* Progreso */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progreso</Text>
                  <Text style={styles.progressNumbers}>
                    {progress} / {achievement.requirement}
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${progressPercentage}%`,
                        backgroundColor: categoryColor
                      }
                    ]} 
                  />
                </View>
                
                <Text style={styles.progressPercentage}>
                  {Math.round(progressPercentage)}% completado
                </Text>
              </View>

              {/* Estado del logro */}
              <View style={styles.statusSection}>
                {isUnlocked ? (
                  <View style={styles.unlockedStatus}>
                    <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.unlockedText}>¡Logro desbloqueado!</Text>
                    {userProgress?.unlockedAt && (
                      <Text style={styles.unlockedDate}>
                        Desbloqueado el {userProgress.unlockedAt.toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.lockedStatus}>
                    <MaterialIcons name="lock" size={24} color="#757575" />
                    <Text style={styles.lockedText}>
                      {achievement.requirement - progress} más para desbloquear
                    </Text>
                  </View>
                )}
              </View>

              {/* Botón de celebración si está desbloqueado */}
              {isUnlocked && onCelebrate && (
                <TouchableOpacity 
                  style={[styles.celebrateButton, { backgroundColor: categoryColor }]}
                  onPress={onCelebrate}
                >
                  <MaterialIcons name="celebration" size={20} color="#FFFFFF" />
                  <Text style={styles.celebrateText}>¡Celebrar!</Text>
                </TouchableOpacity>
              )}

              {/* Logro secreto */}
              {achievement.isSecret && (
                <View style={styles.secretBadge}>
                  <MaterialIcons name="visibility-off" size={16} color="#9C27B0" />
                  <Text style={styles.secretText}>Logro Secreto</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    margin: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    width: SCREEN_WIDTH - 40,
    borderWidth: 2,
    borderColor: '#DF2892',
    shadowColor: '#DF2892',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressNumbers: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  unlockedStatus: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a3d1a',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  unlockedDate: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
  },
  lockedStatus: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  lockedText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  celebrateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1a2a',
    padding: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  secretText: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: 'bold',
  },
});

export default AchievementModal;