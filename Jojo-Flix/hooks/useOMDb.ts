// React Hooks para OMDb API
import { useState, useEffect } from 'react';
import OMDbService, { OMDbMovie, OMDbSeries, OMDbSeason, OMDbSearchResult } from '../services/OMDbService';
import EnhancedActorService, { ActorPhoto } from '../services/EnhancedActorService';

// Hook para obtener detalles de contenido
export function useOMDbDetails(title: string | null, type?: 'movie' | 'series') {
  const [data, setData] = useState<OMDbMovie | OMDbSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!title) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const omdbService = OMDbService.getInstance();
        const result = await omdbService.searchAndGetDetails(title, type);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [title, type]);

  return { data, loading, error };
}

// Hook para obtener temporada de serie
export function useOMDbSeason(imdbId: string | null, season: number) {
  const [data, setData] = useState<OMDbSeason | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imdbId) {
      setData(null);
      return;
    }

    const fetchSeason = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const omdbService = OMDbService.getInstance();
        const result = await omdbService.getSeason(imdbId, season);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar temporada');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeason();
  }, [imdbId, season]);

  return { data, loading, error };
}

// Hook para buscar contenido
export function useOMDbSearch(query: string, type?: 'movie' | 'series') {
  const [results, setResults] = useState<OMDbSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const omdbService = OMDbService.getInstance();
        const result = await omdbService.searchByTitle(query, type);
        setResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error en búsqueda');
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce de 500ms
    const timeoutId = setTimeout(searchData, 500);
    return () => clearTimeout(timeoutId);
  }, [query, type]);

  return { results, loading, error };
}

// Hook para obtener múltiples contenidos por títulos
export function useOMDbMultiple(titles: string[], type?: 'movie' | 'series') {
  const [data, setData] = useState<(OMDbMovie | OMDbSeries)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!titles || titles.length === 0) {
      setData([]);
      return;
    }

    const fetchMultiple = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const omdbService = OMDbService.getInstance();
        const results = await omdbService.getMultipleByTitles(titles, type);
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar contenidos');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMultiple();
  }, [titles.join(','), type]); // Dependencia basada en títulos unidos

  return { data, loading, error };
}

// Hook personalizado para la integración con tu app
export function useContentOMDb(contentTitle: string | null, isMovie: boolean = true) {
  const type = isMovie ? 'movie' : 'series';
  const { data, loading, error } = useOMDbDetails(contentTitle, type);
  
  // Transformar datos a formato útil para tu app
  const transformedData = data ? {
    title: data.Title,
    year: data.Year,
    rating: data.imdbRating,
    plot: data.Plot,
    poster: data.Poster,
    actors: data.Actors.split(', '),
    director: data.Director,
    genre: data.Genre.split(', '),
    runtime: data.Runtime,
    country: data.Country,
    language: data.Language,
    awards: data.Awards,
    ratings: data.Ratings,
    imdbId: data.imdbID,
    isSeries: data.Type === 'series',
    totalSeasons: 'totalSeasons' in data ? data.totalSeasons : undefined
  } : null;

  return {
    omdbData: transformedData,
    loading,
    error,
    hasData: !!transformedData
  };
}

// Hook para obtener fotos de actores
export function useActorPhotos(actors: string[]) {
  const [photos, setPhotos] = useState<ActorPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actors || actors.length === 0) {
      setPhotos([]);
      return;
    }

    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const photoService = EnhancedActorService.getInstance();
        // Intentar obtener fotos reales primero
        const actorPhotos = await photoService.getMultipleActorPhotos(actors);
        setPhotos(actorPhotos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar fotos');
        // En caso de error, usar placeholders
        const photoService = EnhancedActorService.getInstance();
        const actorPhotos = photoService.getPlaceholderPhotos(actors);
        setPhotos(actorPhotos);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [actors.join(',')]); // Dependencia basada en actores unidos

  return { photos, loading, error };
}
