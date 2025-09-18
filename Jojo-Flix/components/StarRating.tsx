import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
  color?: string;
  emptyColor?: string;
  showHalfStars?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  size = 24,
  disabled = false,
  color = '#FFD700',
  emptyColor = '#666',
  showHalfStars = false
}) => {
  const [tempRating, setTempRating] = useState(0);
  const currentRating = tempRating || rating;

  const handleStarPress = (starRating: number) => {
    if (disabled) return;
    
    if (onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarPressIn = (starRating: number) => {
    if (disabled) return;
    setTempRating(starRating);
  };

  const handleStarPressOut = () => {
    if (disabled) return;
    setTempRating(0);
  };

  const renderStar = (starIndex: number) => {
    const starRating = starIndex + 1;
    const isActive = currentRating >= starRating;
    const isHalfActive = showHalfStars && currentRating >= starIndex + 0.5 && currentRating < starRating;

    let iconName: 'star' | 'star-border' | 'star-half' = 'star-border';
    let iconColor = emptyColor;

    if (isActive) {
      iconName = 'star';
      iconColor = color;
    } else if (isHalfActive) {
      iconName = 'star-half';
      iconColor = color;
    }

    if (disabled && !onRatingChange) {
      return (
        <View key={starIndex} style={[styles.star, { opacity: disabled ? 0.6 : 1 }]}>
          <MaterialIcons
            name={iconName}
            size={size}
            color={iconColor}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={starIndex}
        style={[styles.star, { opacity: disabled ? 0.6 : 1 }]}
        onPress={() => handleStarPress(starRating)}
        onPressIn={() => handleStarPressIn(starRating)}
        onPressOut={handleStarPressOut}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={iconName}
          size={size}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});

export default StarRating;
