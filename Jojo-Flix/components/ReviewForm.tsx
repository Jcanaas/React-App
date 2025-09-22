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
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../components/firebaseConfig';
import { reviewService, UserReview } from '../services/ReviewService';
import StarRating from './StarRating';

interface ReviewFormProps {
  visible: boolean;
  onClose: () => void;
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  onReviewSubmitted?: (review: UserReview) => void;
  editingReview?: UserReview | null;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  visible,
  onClose,
  movieId,
  movieTitle,
  moviePoster,
  onReviewSubmitted,
  editingReview
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [spoilerWarning, setSpoilerWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isEditing = !!editingReview;

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setReviewText(editingReview.reviewText);
      setSpoilerWarning(editingReview.spoilerWarning);
    } else {
      // Reset form for new review
      setRating(0);
      setReviewText('');
      setSpoilerWarning(false);
    }
    setErrors({});
  }, [editingReview, visible]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (rating === 0) {
      newErrors.rating = 'Debes seleccionar una calificación';
    }

    if (reviewText.trim().length < 10) {
      newErrors.reviewText = 'La reseña debe tener al menos 10 caracteres';
    }

    if (reviewText.trim().length > 1000) {
      newErrors.reviewText = 'La reseña no puede tener más de 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para escribir una reseña');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editingReview) {
        // Actualizar reseña existente
        await reviewService.updateReview(editingReview.id!, {
          rating,
          reviewText: reviewText.trim(),
          spoilerWarning
        });

        const updatedReview: UserReview = {
          ...editingReview,
          rating,
          reviewText: reviewText.trim(),
          spoilerWarning,
          timestamp: new Date()
        };

        onReviewSubmitted?.(updatedReview);
        Alert.alert('¡Éxito!', 'Tu reseña ha sido actualizada');
      } else {
        // Crear nueva reseña
        const reviewData: any = {
          userId: user.uid,
          movieId,
          movieTitle,
          userName: user.displayName || user.email?.split('@')[0] || 'Usuario Anónimo',
          rating,
          reviewText: reviewText.trim(),
          spoilerWarning
        };

        console.log('📝 REVIEW FORM: Creando reseña con datos:', {
          userId: reviewData.userId,
          movieId: reviewData.movieId,
          movieTitle: reviewData.movieTitle,
          rating: reviewData.rating
        });

        // Solo agregar campos opcionales si tienen valor
        if (moviePoster) {
          reviewData.moviePoster = moviePoster;
          console.log('📝 REVIEW FORM: Agregando poster:', moviePoster);
        }
        if (user.photoURL) {
          reviewData.userAvatar = user.photoURL;
        }

        const reviewId = await reviewService.createReview(reviewData);
        console.log('✅ REVIEW FORM: Reseña creada con ID:', reviewId);

        const newReview: UserReview = {
          id: reviewId,
          userId: user.uid,
          userName: user.displayName || user.email || 'Usuario Anónimo',
          userAvatar: user.photoURL || undefined,
          movieId,
          movieTitle,
          moviePoster,
          rating,
          reviewText: reviewText.trim(),
          spoilerWarning,
          timestamp: new Date(),
          likes: 0,
          likedBy: [],
          reported: false,
          helpful: 0,
          helpfulBy: []
        };

        onReviewSubmitted?.(newReview);
        Alert.alert('¡Éxito!', 'Tu reseña ha sido publicada');
      }

      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la reseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    setSpoilerWarning(false);
    setErrors({});
    onClose();
  };

  const handleDelete = () => {
    if (!editingReview) return;

    Alert.alert(
      'Eliminar Reseña',
      '¿Estás seguro de que quieres eliminar tu reseña? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await reviewService.deleteReview(editingReview.id!);
              Alert.alert('Eliminada', 'Tu reseña ha sido eliminada');
              handleClose();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la reseña');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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
          
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Reseña' : 'Escribir Reseña'}
          </Text>
          
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <MaterialIcons name="delete" size={24} color="#FF4444" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Movie Info */}
          <View style={styles.movieInfo}>
            <MaterialIcons name="movie" size={24} color="#FFD700" />
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movieTitle}
            </Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificación *</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={32}
                color="#FFD700"
              />
              <Text style={styles.ratingText}>
                {rating > 0 ? `${rating}/5 estrella${rating !== 1 ? 's' : ''}` : 'Selecciona tu calificación'}
              </Text>
            </View>
            {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
          </View>

          {/* Review Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tu Reseña * ({reviewText.length}/1000)
            </Text>
            <TextInput
              style={[styles.textInput, errors.reviewText && styles.textInputError]}
              placeholder="Comparte tu opinión sobre esta película/serie..."
              placeholderTextColor="#666"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            {errors.reviewText && <Text style={styles.errorText}>{errors.reviewText}</Text>}
          </View>

          {/* Spoiler Warning */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <MaterialIcons name="warning" size={20} color="#FF9800" />
                <Text style={styles.switchText}>Contiene spoilers</Text>
              </View>
              <Switch
                value={spoilerWarning}
                onValueChange={setSpoilerWarning}
                trackColor={{ false: '#666', true: '#FF9800' }}
                thumbColor={spoilerWarning ? '#fff' : '#ccc'}
              />
            </View>
            <Text style={styles.switchDescription}>
              Activa esta opción si tu reseña revela detalles importantes de la trama
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || rating === 0 || reviewText.trim().length < 10) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || rating === 0 || reviewText.trim().length < 10}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons 
                  name={isEditing ? "edit" : "send"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Actualizar Reseña' : 'Publicar Reseña'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Pautas para reseñas:</Text>
            <Text style={styles.guidelinesText}>
              • Sé respetuoso con otros usuarios{'\n'}
              • Evita spoilers sin avisar{'\n'}
              • Comparte tu opinión honesta{'\n'}
              • No uses lenguaje ofensivo
            </Text>
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
  deleteButton: {
    padding: 8,
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
  movieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
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
  ratingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
  },
  ratingText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputError: {
    borderColor: '#FF4444',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  switchDescription: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  guidelines: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  guidelinesTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  guidelinesText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ReviewForm;
