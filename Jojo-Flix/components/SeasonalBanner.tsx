import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSeasonalNotifications } from '../services/SeasonalNotificationService';

interface SeasonalBannerProps {
  onContentPress?: (contentId: string) => void;
}

const SeasonalBanner: React.FC<SeasonalBannerProps> = memo(({ onContentPress }) => {
  const router = useRouter();
  const { getCurrentEventInfo } = useSeasonalNotifications();
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadEventInfo = async () => {
      const info = getCurrentEventInfo();
      setEventInfo(info);
    };

    loadEventInfo();
  }, [getCurrentEventInfo]);

  if (!eventInfo || !eventInfo.event) {
    return null; // No hay evento estacional activo
  }

  const { event, content, daysLeft } = eventInfo;

  const handleContentPress = (contentId: string) => {
    if (onContentPress) {
      onContentPress(contentId);
    } else {
      router.push({ pathname: '/content-detail-screen', params: { contentId } });
    }
  };

  const getGradientColors = (eventId: string): [string, string] => {
    switch (eventId) {
      case 'halloween':
        return ['#FF6B00', '#8B0000']; // Naranja a rojo oscuro
      case 'christmas':
        return ['#FF0000', '#00AA00']; // Rojo a verde
      case 'pride':
        return ['#FF0080', '#8000FF']; // Rosa a morado
      case 'valentine':
        return ['#FF69B4', '#FF1493']; // Rosa claro a rosa fuerte
      default:
        return ['#DF2892', '#8B0060'];
    }
  };

  const [primaryColor, secondaryColor] = getGradientColors(event.id);

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      {/* Header del banner */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerContent}>
          <Text style={styles.emoji}>{event.emoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title.replace(event.emoji, '').trim()}
            </Text>
            <Text style={styles.subtitle}>
              {daysLeft > 0 ? `${daysLeft} días restantes` : 'Último día'}
            </Text>
          </View>
          <MaterialIcons 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color="#fff" 
          />
        </View>
      </TouchableOpacity>

      {/* Contenido expandible */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{event.body}</Text>
          {content.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>✨ Contenido especial:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
              >
                {content.slice(0, 6).map((item: any, index: number) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.contentItem}
                    onPress={() => handleContentPress(item.id)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={item.verticalbanner || item.fondo} 
                      style={styles.contentImage}
                      resizeMode="cover"
                    />
                    <View style={styles.contentOverlay}>
                      <Text style={styles.contentTitle} numberOfLines={2}>
                        {item.nombre}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Botón de acción */}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: secondaryColor }]}
            onPress={() => {
              // Aquí puedes implementar navegación a una pantalla de categoría
              router.push('/');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>
              Ver todo el contenido {event.emoji}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentScroll: {
    marginBottom: 16,
  },
  contentContainer: {
    paddingRight: 16,
  },
  contentItem: {
    width: 120,
    height: 160,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  contentTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

SeasonalBanner.displayName = 'SeasonalBanner';

export default SeasonalBanner;
