import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationManager from '../../services/NotificationService';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useNotificationContext } from '../../contexts/NotificationContext';

// Componente para el icono de Social con contador
const SocialTabIcon = ({ color, size }: { color: string; size: number }) => {
  const { totalUnreadCount } = useNotificationContext();
  
  return (
    <View style={styles.iconContainer}>
      <MaterialIcons name="people" size={size} color={color} />
      {totalUnreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    // Inicializar notificaciones cuando la app se abre
    const initNotifications = async () => {
      try {
        await NotificationManager.setupNotifications();
        console.log('✅ Notificaciones inicializadas');
      } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
      }
    };

    // Manejar cuando el usuario toca una notificación
    const notificationSubscription = NotificationManager.setupNotificationTapListener((response) => {
      const data = response.notification.request.content.data;
      
      console.log('🔔 Notificación tocada:', data);
      
      switch (data.type) {
        case 'chat_message':
          if (data.chatId) {
            router.push(`/chat?chatId=${data.chatId}`);
          }
          break;
        case 'friend_request':
          router.push('/social');
          break;
        default:
          router.push('/');
      }
    });

    // Manejar notificaciones cuando la app está en primer plano
    const foregroundSubscription = NotificationManager.setupForegroundNotificationListener((notification) => {
      console.log('🔔 Notificación recibida en primer plano:', notification);
    });

    initNotifications();

    return () => {
      notificationSubscription?.remove();
      foregroundSubscription?.remove();
    };
  }, []);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#DF2892',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#222',
          borderTopColor: '#333',
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => (
            <SocialTabIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#DF2892',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});