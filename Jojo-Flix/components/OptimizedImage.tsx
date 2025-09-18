import React, { memo, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Image, ImageStyle, Text, View } from 'react-native';
import { useOptimizedImage } from '../hooks/useOptimizedImage';

interface OptimizedImageProps {
  source: any;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: any;
  showLoader?: boolean;
  loaderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  showLoader = true,
  loaderColor = '#DF2892',
  onLoad,
  onError
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isLoading, hasError, onLoad: cacheOnLoad, onError: cacheOnError, onLoadStart } = useOptimizedImage(source);

  useEffect(() => {
    if (!isLoading && !hasError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isLoading, hasError, fadeAnim]);

  const handleLoad = () => {
    cacheOnLoad();
    onLoad?.();
  };

  const handleError = () => {
    cacheOnError();
    onError?.();
  };

  const containerStyle = Array.isArray(style) ? style : [style];

  return (
    <View style={containerStyle as any}>
      {/* Placeholder mientras carga */}
      {isLoading && placeholder && (
        <Image
          source={placeholder}
          style={style}
          resizeMode={resizeMode}
        />
      )}

      {/* Loader opcional */}
      {isLoading && showLoader && !placeholder && (
        <View style={[
          style,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#222'
          }
        ]}>
          <ActivityIndicator size="small" color={loaderColor} />
        </View>
      )}

      {/* Imagen principal con fade in */}
      {!hasError && (
        <Animated.View style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: fadeAnim
          }
        ]}>
          <Image
            source={source}
            style={style}
            resizeMode={resizeMode}
            onLoadStart={onLoadStart}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Animated.View>
      )}

      {/* Fallback en caso de error */}
      {hasError && (
        <View style={[
          style,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#333'
          }
        ]}>
          <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
            Error al cargar imagen
          </Text>
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
