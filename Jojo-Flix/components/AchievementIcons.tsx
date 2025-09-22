import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AchievementIconProps {
  size?: number;
  color?: string;
  variant?: 'locked' | 'unlocked';
}

// Icono de primera reseña
export const FirstReviewIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="reviewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#DF2892' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#FF69B4' : '#999'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4v16l5.5-3.5L15 20V4c0-1.1-.9-2-2-2z"
      fill="url(#reviewGrad)"
    />
    <Circle cx="10" cy="8" r="1.5" fill="#fff" />
    <Path d="M7 11h6v1H7zm0 2h6v1H7z" fill="#fff" />
  </Svg>
);

// Icono de experto en reseñas
export const ReviewExpertIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="expertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#FFD700' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#FFA500' : '#999'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="url(#expertGrad)"
    />
    <Path d="M12 7l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3L12 7z" fill="#fff" />
  </Svg>
);

// Icono de amante de la música
export const MusicLoverIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="musicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#E91E63' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#DF2892' : '#999'} />
      </LinearGradient>
    </Defs>
    <Circle cx="8" cy="17" r="3" fill="url(#musicGrad)" />
    <Circle cx="16" cy="15" r="3" fill="url(#musicGrad)" />
    <Path d="M11 4v8.17c-.5-.17-1-.17-1.5 0V6l7-2v6.17c-.5-.17-1-.17-1.5 0V2l-4.5 2z" fill="url(#musicGrad)" />
    <Circle cx="8" cy="17" r="1" fill="#fff" />
    <Circle cx="16" cy="15" r="1" fill="#fff" />
  </Svg>
);

// Icono de tiempo en app
export const AppTimeIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="timeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#00BCD4' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#0097A7' : '#999'} />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#timeGrad)" />
    <Path d="M12 6v6l4 2-1 1.5-5-3V6h2z" fill="#fff" />
    <Circle cx="12" cy="12" r="1" fill="#fff" />
  </Svg>
);

// Icono de mensajes
export const MessagesIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="msgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#4CAF50' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#2E7D32' : '#999'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z"
      fill="url(#msgGrad)"
    />
    <Path d="M6 9h12v2H6zm0-3h12v2H6zm0 6h8v2H6z" fill="#fff" />
  </Svg>
);

// Icono de logro especial
export const SpecialIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="specialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#9C27B0' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#6A1B9A' : '#999'} />
      </LinearGradient>
    </Defs>
    <G>
      <Path
        d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6L12 2z"
        fill="url(#specialGrad)"
      />
      <Circle cx="12" cy="12" r="3" fill="#fff" />
      <Path d="M12 10l1 2h2l-1.5 1.5 0.5 2-2-1-2 1 0.5-2L9 12h2l1-2z" fill="url(#specialGrad)" />
    </G>
  </Svg>
);

// Icono de trofeo (logros master)
export const TrophyIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#FFD700' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#FFA000' : '#999'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h1v6c0 2.2-1.8 4-4 4v2h2v2H8v-2h2v-2c-2.2 0-4-1.8-4-4V4h1z"
      fill="url(#trophyGrad)"
    />
    <Path d="M9 4h6v6c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V4z" fill="#fff" />
    <Circle cx="12" cy="7" r="1" fill="url(#trophyGrad)" />
  </Svg>
);

// Icono de corona (logros legendarios)
export const CrownIcon: React.FC<AchievementIconProps> = ({ size = 32, color = '#DF2892', variant = 'unlocked' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={variant === 'unlocked' ? '#FF6B35' : '#666'} />
        <Stop offset="100%" stopColor={variant === 'unlocked' ? '#F7931E' : '#999'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M5 16L3 7l3.5 4 3-6 3 6L16 7l-2 9H5z"
      fill="url(#crownGrad)"
    />
    <Path d="M6 16h10v2H6z" fill="url(#crownGrad)" />
    <Circle cx="7" cy="10" r="1" fill="#fff" />
    <Circle cx="12" cy="8" r="1" fill="#fff" />
    <Circle cx="17" cy="10" r="1" fill="#fff" />
  </Svg>
);

// Función helper para obtener el icono por ID de logro
export const getAchievementIcon = (achievementId: string, size: number = 32, variant: 'locked' | 'unlocked' = 'unlocked') => {
  switch (achievementId) {
    case 'first_review':
      return <FirstReviewIcon size={size} variant={variant} />;
    case 'review_enthusiast':
    case 'review_expert':
      return <ReviewExpertIcon size={size} variant={variant} />;
    case 'review_master':
      return <TrophyIcon size={size} variant={variant} />;
    case 'music_lover':
    case 'music_addict':
    case 'music_marathon':
      return <MusicLoverIcon size={size} variant={variant} />;
    case 'music_legend':
      return <CrownIcon size={size} variant={variant} />;
    case 'first_hour':
    case 'time_explorer':
    case 'time_master':
      return <AppTimeIcon size={size} variant={variant} />;
    case 'first_message':
    case 'chatty':
    case 'social_butterfly':
    case 'chat_master':
      return <MessagesIcon size={size} variant={variant} />;
    case 'early_bird':
    case 'night_owl':
    case 'weekend_warrior':
      return <SpecialIcon size={size} variant={variant} />;
    default:
      return <TrophyIcon size={size} variant={variant} />;
  }
};