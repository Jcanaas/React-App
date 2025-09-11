// Configuración de TMDB API
export const TMDB_CONFIG = {
  // Reemplaza 'TU_API_KEY_AQUI' con tu API key real de TMDB
  API_KEY: 'TU_API_KEY_AQUI',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  
  // Tamaños de imagen disponibles
  IMAGE_SIZES: {
    poster: {
      small: '/w154',
      medium: '/w342',
      large: '/w500',
      original: '/original'
    },
    backdrop: {
      small: '/w300',
      medium: '/w780',
      large: '/w1280',
      original: '/original'
    },
    profile: {
      small: '/w45',
      medium: '/w185',
      large: '/h632',
      original: '/original'
    }
  }
};

// Función para obtener la URL completa de imagen
export const getImageUrl = (path: string, size: string = 'medium', type: 'poster' | 'backdrop' | 'profile' = 'poster') => {
  if (!path) return null;
  
  const sizeMap = TMDB_CONFIG.IMAGE_SIZES[type];
  const selectedSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
  
  return `${TMDB_CONFIG.IMAGE_BASE_URL}${selectedSize}${path}`;
};

// Función para verificar si la API key está configurada
export const isApiKeyConfigured = () => {
  return TMDB_CONFIG.API_KEY && TMDB_CONFIG.API_KEY !== 'TU_API_KEY_AQUI';
};
