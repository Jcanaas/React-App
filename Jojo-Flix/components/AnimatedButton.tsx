import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  pressedColor?: string;
  disabled?: boolean;
  loading?: boolean;
  animationType?: 'bounce' | 'scale' | 'fade' | 'slide';
  lottieAnimation?: any; // JSON de animación Lottie
}

export default function AnimatedButton({
  title,
  onPress,
  style,
  textStyle,
  icon,
  iconSize = 20,
  iconColor = '#FFFFFF',
  backgroundColor = '#DF2892',
  pressedColor = '#B8216B',
  disabled = false,
  loading = false,
  animationType = 'scale',
  lottieAnimation,
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    // Reproducir animación Lottie si existe
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    // Animaciones según el tipo
    switch (animationType) {
      case 'bounce':
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValue, {
            toValue: 1.1,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValue, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 'scale':
        Animated.timing(animatedValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }).start();
        break;
        
      case 'fade':
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }).start();
        break;
        
      case 'slide':
        Animated.timing(animatedValue, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }).start();
        break;
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'fade':
        return {
          opacity: animatedValue,
          transform: [{ scale: 1 }],
        };
      case 'slide':
        return {
          transform: [
            { scale: animatedValue },
            { translateY: animatedValue.interpolate({
              inputRange: [0.98, 1],
              outputRange: [2, 0],
            }) }
          ],
        };
      default:
        return {
          transform: [{ scale: animatedValue }],
        };
    }
  };

  const buttonBackgroundColor = disabled 
    ? '#666666' 
    : isPressed 
      ? pressedColor 
      : backgroundColor;

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: buttonBackgroundColor },
          getAnimatedStyle(),
          style,
        ]}
      >
        {/* Animación Lottie de fondo (opcional) */}
        {lottieAnimation && (
          <View style={styles.lottieBackground} pointerEvents="none">
            <LottieView
              ref={lottieRef}
              source={lottieAnimation}
              style={StyleSheet.absoluteFill}
              autoPlay={false}
              loop={false}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../assets/animations/loading.json')}
              style={styles.loadingAnimation}
              autoPlay
              loop
            />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && (
              <MaterialIcons 
                name={icon} 
                size={iconSize} 
                color={iconColor}
                style={styles.icon}
              />
            )}
            <Text 
              style={[styles.buttonText, textStyle]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 44,
    flexShrink: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 6,
    flexShrink: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 0,
  },
  lottieBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: {
    width: 24,
    height: 24,
  },
});