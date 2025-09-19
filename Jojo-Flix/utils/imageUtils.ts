/**
 * Utilidades para manejo seguro de imágenes
 */

/**
 * Valida si una URI es válida para ser usada en componentes Image
 * @param uri - La URI a validar
 * @returns La URI validada o null si no es válida
 */
export const validateImageUri = (uri: any): string | null => {
  if (typeof uri !== 'string') {
    console.warn('🖼️ URI de imagen inválida (no es string):', typeof uri, uri);
    return null;
  }
  
  if (!uri || uri.trim() === '') {
    return null;
  }
  
  // Verificar que sea una URL válida
  try {
    new URL(uri);
    return uri;
  } catch {
    // Si no es una URL válida, verificar si es una URI relativa válida
    if (uri.startsWith('/') || uri.startsWith('./') || uri.startsWith('../')) {
      return uri;
    }
    
    console.warn('🖼️ URI de imagen inválida:', uri);
    return null;
  }
};

/**
 * Crea un source objeto seguro para componentes Image
 * @param uri - La URI de la imagen
 * @param fallbackUri - URI de respaldo opcional
 * @returns Objeto source para Image component
 */
export const createSafeImageSource = (uri: any, fallbackUri?: string) => {
  const validUri = validateImageUri(uri) || validateImageUri(fallbackUri);
  
  if (!validUri) {
    return null;
  }
  
  return { uri: validUri };
};

/**
 * Placeholder por defecto para avatares
 */
export const DEFAULT_AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff';

/**
 * Crea un source seguro para avatares con placeholder por defecto
 */
export const createSafeAvatarSource = (uri: any) => {
  return createSafeImageSource(uri, DEFAULT_AVATAR_PLACEHOLDER);
};