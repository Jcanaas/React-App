import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../components/firebaseConfig';
import { userProfileService, UserProfile } from '../services/UserProfileService';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onProfileUpdated
}) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const user = auth.currentUser;

  useEffect(() => {
    if (visible && user) {
      loadUserProfile();
    }
  }, [visible, user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await userProfileService.getUserProfile(user.uid);
      
      if (userProfile) {
        setProfile(userProfile);
        setDisplayName(userProfile.displayName);
        setBio(userProfile.bio || '');
      } else {
        // Configurar valores por defecto
        const defaultName = user.displayName || user.email?.split('@')[0] || 'Usuario';
        setDisplayName(defaultName);
        setBio('');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (displayName.trim().length < 2) {
      newErrors.displayName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (displayName.trim().length > 50) {
      newErrors.displayName = 'El nombre no puede tener más de 50 caracteres';
    }

    if (bio.length > 500) {
      newErrors.bio = 'La descripción no puede tener más de 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      await userProfileService.createOrUpdateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim()
      });

      Alert.alert('¡Éxito!', 'Tu perfil ha sido actualizado');
      onProfileUpdated?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const getCurrentAvatar = () => {
    if (user?.photoURL) return user.photoURL;
    return null;
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Administrar Perfil</Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <MaterialIcons name="check" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Preview - Solo mostrar, no editar */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionTitle}>Foto de Perfil</Text>
            <View style={styles.avatarContainer}>
              {getCurrentAvatar() ? (
                <Image 
                  source={{ uri: getCurrentAvatar()! }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={48} color="#666" />
                </View>
              )}
            </View>
            <Text style={styles.helpText}>
              Para cambiar la foto, usa la opción "Cambiar foto" en tu perfil
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nombre de Usuario * ({displayName.length}/50)
            </Text>
            <TextInput
              style={[styles.textInput, errors.displayName && styles.textInputError]}
              placeholder="Tu nombre de usuario"
              placeholderTextColor="#666"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
            />
            {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Descripción ({bio.length}/500)
            </Text>
            <TextInput
              style={[styles.textInputMultiline, errors.bio && styles.textInputError]}
              placeholder="Cuéntanos algo sobre ti... (opcional)"
              placeholderTextColor="#666"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.helpText}>
              Campo opcional. Puedes dejarlo vacío si prefieres.
            </Text>
            {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
          </View>

          {/* User Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Información de la Cuenta</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#888" />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
            {profile && (
              <>
                <View style={styles.infoRow}>
                  <MaterialIcons name="rate-review" size={20} color="#888" />
                  <Text style={styles.infoText}>
                    {profile.totalReviews} reseña{profile.totalReviews !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="date-range" size={20} color="#888" />
                  <Text style={styles.infoText}>
                    Miembro desde {profile.joinDate.toLocaleDateString('es-ES')}
                  </Text>
                </View>
              </>
            )}
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginTop: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputMultiline: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputError: {
    borderColor: '#FF4444',
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 12,
  },
});

export default UserProfileModal;
