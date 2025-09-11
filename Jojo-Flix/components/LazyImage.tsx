import { Image, ImageContentFit } from 'expo-image';
import React, { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageStyle, StyleSheet, Text, View } from 'react-native';
import ImageManager from './ImageManager';

interface LazyImageProps {
  source: any;
  style: ImageStyle;
  placeholder?: any;
  showLoader?: boolean;
  resizeMode?: ImageContentFit;
}

const LazyImage: React.FC<LazyImageProps> = memo(({ 
  source, 
  style, 
  placeholder,
  showLoader = true,
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reiniciar estados cuando cambie la fuente
    setIsLoading(true);
    setIsError(false);
    opacity.setValue(0);
  }, [source]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsError(false);
    
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
    console.warn('Image failed to load:', source);
  };

  const optimizedSource = ImageManager.getImage(source);

  return (
    <View style={style}>
      {/* Placeholder mientras carga */}
      {isLoading && placeholder && (
        <Image 
          source={placeholder} 
          style={[style, StyleSheet.absoluteFill]} 
          contentFit={resizeMode}
        />
      )}
      
      {/* Loader opcional */}
      {isLoading && showLoader && !placeholder && (
        <View style={[style, styles.loaderContainer]}>
          <ActivityIndicator size="small" color="#DF2892" />
        </View>
      )}
      
      {/* Imagen principal */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <Image
          source={optimizedSource}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          contentFit={resizeMode}
          transition={200}
          placeholder={placeholder}
          recyclingKey={typeof optimizedSource === 'string' ? optimizedSource : JSON.stringify(optimizedSource)}
        />
      </Animated.View>
      
      {/* Fallback en caso de error */}
      {isError && (
        <View style={[style, styles.errorContainer]}>
          <Text style={styles.errorText}>Error al cargar</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  errorText: {
    color: '#666',
    fontSize: 12,
  },
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
