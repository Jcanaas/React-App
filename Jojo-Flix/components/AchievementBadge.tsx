import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Achievement, UserAchievement, AchievementCategory } from '../services/AchievementService';

interface AchievementBadgeProps {
  achievement: Achievement;
  userProgress?: UserAchievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  style?: ViewStyle;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  userProgress,
  onPress,
  size = 'medium',
  showProgress = true,
  style
}) => {
  const isUnlocked = userProgress?.isUnlocked || false;
  const progress = userProgress?.progress || 0;
  const progressPercentage = Math.min((progress / achievement.requirement) * 100, 100);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          icon: 20,
          title: 10,
          points: 8
        };
      case 'large':
        return {
          container: { width: 120, height: 120 },
          icon: 40,
          title: 14,
          points: 12
        };
      default: // medium
        return {
          container: { width: 80, height: 80 },
          icon: 28,
          title: 12,
          points: 10
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor: isUnlocked ? '#1a1a1a' : '#0a0a0a',
          borderColor: isUnlocked ? achievement.color : '#333',
          shadowColor: isUnlocked ? achievement.color : '#000',
        },
        style
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {/* Icono MaterialIcons del logro */}
      <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? '#2a2a2a' : '#151515' }]}>
        <MaterialIcons 
          name={achievement.icon as any}
          size={sizeStyles.icon}
          color={isUnlocked ? achievement.color : '#555'} 
        />
      </View>

      {/* Indicador de desbloqueado */}
      {isUnlocked && (
        <View style={[styles.unlockedIndicator, { backgroundColor: achievement.color }]}>
          <MaterialIcons 
            name="check" 
            size={sizeStyles.icon * 0.4} 
            color="#FFFFFF" 
          />
        </View>
      )}

      {/* Barra de progreso */}
      {showProgress && !isUnlocked && size !== 'small' && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${progressPercentage}%`,
                backgroundColor: achievement.color
              }
            ]} 
          />
        </View>
      )}

      {/* Puntos */}
      {size !== 'small' && (
        <View style={styles.pointsContainer}>
          <Text 
            style={[
              styles.points,
              { 
                fontSize: sizeStyles.points,
                color: isUnlocked ? '#FFFFFF' : '#777'
              }
            ]}
          >
            {achievement.points}pts
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 8,
    width: '80%',
    height: '60%',
  },
  unlockedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  pointsContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    left: 2,
  },
  points: {
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default AchievementBadge;