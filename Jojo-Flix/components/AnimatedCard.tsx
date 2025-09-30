import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  onPress?: () => void;
  isCompleted?: boolean;
  progress?: number; // 0-100
  animateOnMount?: boolean;
  delay?: number;
  children?: React.ReactNode;
  lottieAnimation?: any;
  showProgressBar?: boolean;
  layout?: 'horizontal' | 'vertical'; // Nueva prop para controlar el layout
}

export default function AnimatedCard({
  title,
  subtitle,
  value,
  icon,
  iconColor = '#DF2892',
  backgroundColor = '#2a2a2a',
  borderColor = '#444',
  onPress,
  isCompleted = false,
  progress = 0,
  animateOnMount = true,
  delay = 0,
  children,
  lottieAnimation,
  showProgressBar = false,
  layout = 'horizontal', // Valor por defecto
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);
  
  const [isPressed, setIsPressed] = useState(false);

  // Normalize progress so callers can pass 0-1 or 0-100
  const normalizedProgress = typeof progress === 'number' ? (progress <= 1 ? progress * 100 : progress) : 0;

  useEffect(() => {
    if (animateOnMount) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: delay + 200,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateOnMount, delay, normalizedProgress, showProgressBar]);


  // Keep progressAnim in sync whenever normalizedProgress changes.
  useEffect(() => {
    if (!showProgressBar) return;
    if (animateOnMount) {
      Animated.timing(progressAnim, {
        toValue: normalizedProgress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      // If we're not animating on mount, just set the value immediately
      progressAnim.setValue(normalizedProgress);
    }
  }, [normalizedProgress, showProgressBar, animateOnMount]);

  useEffect(() => {
    // Reproducir animación Lottie cuando se complete
    if (isCompleted && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [isCompleted]);

  const handlePressIn = () => {
    if (!onPress) return;
    setIsPressed(true);
    
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      // Animación de tap
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      onPress();
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor,
      borderColor: isCompleted ? '#4CAF50' : borderColor,
      borderWidth: isCompleted ? 2 : 1,
    },
    {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim },
      ],
    },
  ];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // expose a derived value for display (rounded percent)
  const [displayProgress, setDisplayProgress] = useState(Math.round(normalizedProgress));

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setDisplayProgress(Math.round(value));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  const [barWidth, setBarWidth] = useState(0);
  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, Math.max(barWidth, 0)],
    extrapolate: 'clamp',
  });

  const isVertical = layout === 'vertical';

  const CardContent = (
    <Animated.View style={cardStyle}>
      {/* Animación Lottie de fondo para completado */}
      {isCompleted && lottieAnimation && (
        <View style={styles.completedAnimation} pointerEvents="none">
          <LottieView
            ref={lottieRef}
            source={lottieAnimation}
            style={StyleSheet.absoluteFill}
            autoPlay={false}
            loop={false}
          />
        </View>
      )}

  <View style={[styles.cardHeader, layout === 'vertical' ? styles.cardHeaderVertical : undefined]}>
        {icon && (
          <View style={[styles.iconContainer, isCompleted && styles.completedIcon, layout === 'vertical' ? styles.iconContainerVertical : undefined]}>
            <MaterialIcons 
              name={icon} 
              size={layout === 'vertical' ? 32 : 38} 
              color={isCompleted ? '#4CAF50' : iconColor} 
            />
          </View>
        )}
        
  <View style={[styles.textContainer, layout === 'vertical' ? styles.textContainerVertical : undefined]}>
          <Text style={[styles.title, isCompleted && styles.completedText, layout === 'vertical' && styles.titleVertical]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, layout === 'vertical' && styles.subtitleVertical]}>
              {subtitle}
            </Text>
          )}
        </View>

        {value !== undefined && value !== null && !isVertical && (
          <View style={[styles.valueContainer, isVertical ? styles.valueContainerVertical : undefined]}>
            <Text style={[styles.value, isCompleted && styles.completedValue, isVertical ? styles.valueVertical : undefined]}>
              {String(value)}
            </Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBadge}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>

      {/* Barra de progreso animada */}
      {showProgressBar && (
        <View style={[styles.progressContainer, layout === 'vertical' && styles.progressContainerVertical]}>
          <View
            style={[styles.progressBarBackground, layout === 'vertical' && styles.progressBarBackgroundVertical]}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View 
              style={[
                styles.progressBar,
                { width: animatedWidth }
              ]} 
            />
          </View>
          {layout !== 'vertical' && (
            <Text style={styles.progressText}>{String(displayProgress)}%</Text>
          )}
        </View>
      )}

      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 18,
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#444',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    minWidth: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  cardHeaderVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(223, 40, 146, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  iconContainerVertical: {
    marginBottom: 8,
    marginRight: 0,
    alignSelf: 'center',
  },
  completedIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  textContainerVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  titleVertical: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  completedText: {
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  subtitleVertical: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  valueContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginTop: 2,
  },
  valueContainerVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DF2892',
  },
  valueVertical: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completedValue: {
    color: '#4CAF50',
  },
  completedBadge: {
    marginLeft: 8,
    flexShrink: 0, // No se encoge
  },
  progressContainer: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  progressContainerVertical: {
    justifyContent: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 22,
    backgroundColor: '#444',
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressBarBackgroundVertical: {
    width: '78%',
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#DF2892',
    borderRadius: 16,
  },
  progressText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#CCCCCC',
    minWidth: 35,
    textAlign: 'right',
  },
  childrenContainer: {
    marginTop: 12,
  },
  completedAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
});