import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useFavorites } from '../hooks/useFavorites';
import { ContentItem } from './ContentData';

interface FavoriteButtonProps {
  content: ContentItem;
  size?: number;
  color?: string;
  onToggle?: (isFavorite: boolean) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = memo(({
  content,
  size = 24,
  color = '#DF2892',
  onToggle
}) => {
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const isCurrentlyFavorite = isFavorite(content.id);

  const handlePress = async () => {
    try {
      if (isCurrentlyFavorite) {
        await removeFromFavorites(content.id);
        onToggle?.(false);
      } else {
        await addToFavorites(content);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isCurrentlyFavorite ? color : 'rgba(255,255,255,0.2)' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={isCurrentlyFavorite ? 'favorite' : 'favorite-border'}
        size={size}
        color={isCurrentlyFavorite ? '#fff' : color}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

FavoriteButton.displayName = 'FavoriteButton';

export default FavoriteButton;
