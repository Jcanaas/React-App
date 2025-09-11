import { useState, useEffect, useCallback } from 'react';
import tmdbService, { 
  TMDBMovieDetails, 
  TMDBTVDetails, 
  TMDBCredits, 
  TMDBReview, 
  TMDBVideo, 
  TMDBSeason,
  TMDBEpisode,
  TMDBMovie,
  TMDBTVShow
} from '../services/TMDBService';

export interface ContentDetails {
  details: TMDBMovieDetails | TMDBTVDetails | null;
  credits: TMDBCredits | null;
  reviews: TMDBReview[];
  videos: TMDBVideo[];
  recommendations: (TMDBMovie | TMDBTVShow)[];
  similar: (TMDBMovie | TMDBTVShow)[];
  loading: boolean;
  error: string | null;
}

export interface SeasonDetails {
  season: TMDBSeason | null;
  loading: boolean;
  error: string | null;
}

export function useTMDB() {
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  const configureApiKey = useCallback((apiKey: string) => {
    tmdbService.setApiKey(apiKey);
    setApiKeyConfigured(true);
  }, []);

  const search = useCallback(async (query: string, type: 'movie' | 'tv' | 'multi' = 'multi') => {
    if (!apiKeyConfigured) return null;
    return await tmdbService.search(query, type);
  }, [apiKeyConfigured]);

  const getImageUrl = useCallback((path: string | null, size: string = 'w500') => {
    return tmdbService.getImageUrl(path, size);
  }, []);

  return {
    configureApiKey,
    search,
    getImageUrl,
    apiKeyConfigured,
  };
}

export function useContentDetails(contentId: number | null, type: 'movie' | 'tv') {
  const [data, setData] = useState<ContentDetails>({
    details: null,
    credits: null,
    reviews: [],
    videos: [],
    recommendations: [],
    similar: [],
    loading: false,
    error: null,
  });

  const fetchContentDetails = useCallback(async (id: number) => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [details, credits, reviewsData, videosData, recommendationsData, similarData] = await Promise.all([
        type === 'movie' ? tmdbService.getMovieDetails(id) : tmdbService.getTVDetails(id),
        type === 'movie' ? tmdbService.getMovieCredits(id) : tmdbService.getTVCredits(id),
        type === 'movie' ? tmdbService.getMovieReviews(id) : tmdbService.getTVReviews(id),
        type === 'movie' ? tmdbService.getMovieVideos(id) : tmdbService.getTVVideos(id),
        tmdbService.getRecommendations(type, id),
        tmdbService.getSimilar(type, id),
      ]);

      setData({
        details,
        credits,
        reviews: reviewsData?.results || [],
        videos: videosData?.results || [],
        recommendations: recommendationsData?.results || [],
        similar: similarData?.results || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [type]);

  useEffect(() => {
    if (contentId) {
      fetchContentDetails(contentId);
    }
  }, [contentId, fetchContentDetails]);

  const refetch = useCallback(() => {
    if (contentId) {
      fetchContentDetails(contentId);
    }
  }, [contentId, fetchContentDetails]);

  return { ...data, refetch };
}

export function useSeasonDetails(tvId: number | null, seasonNumber: number | null) {
  const [data, setData] = useState<SeasonDetails>({
    season: null,
    loading: false,
    error: null,
  });

  const fetchSeasonDetails = useCallback(async (id: number, season: number) => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const seasonData = await tmdbService.getTVSeason(id, season);
      setData({
        season: seasonData,
        loading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  useEffect(() => {
    if (tvId && seasonNumber !== null) {
      fetchSeasonDetails(tvId, seasonNumber);
    }
  }, [tvId, seasonNumber, fetchSeasonDetails]);

  const refetch = useCallback(() => {
    if (tvId && seasonNumber !== null) {
      fetchSeasonDetails(tvId, seasonNumber);
    }
  }, [tvId, seasonNumber, fetchSeasonDetails]);

  return { ...data, refetch };
}

export function useTrendingContent() {
  const [trending, setTrending] = useState<{
    movies: TMDBMovie[];
    tvShows: TMDBTVShow[];
    loading: boolean;
    error: string | null;
  }>({
    movies: [],
    tvShows: [],
    loading: false,
    error: null,
  });

  const fetchTrending = useCallback(async () => {
    setTrending(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [moviesData, tvShowsData] = await Promise.all([
        tmdbService.getTrending('movie', 'week'),
        tmdbService.getTrending('tv', 'week'),
      ]);

      setTrending({
        movies: (moviesData?.results as TMDBMovie[]) || [],
        tvShows: (tvShowsData?.results as TMDBTVShow[]) || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setTrending(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return { ...trending, refetch: fetchTrending };
}

export function useTopRated() {
  const [topRated, setTopRated] = useState<{
    movies: TMDBMovie[];
    tvShows: TMDBTVShow[];
    loading: boolean;
    error: string | null;
  }>({
    movies: [],
    tvShows: [],
    loading: false,
    error: null,
  });

  const fetchTopRated = useCallback(async () => {
    setTopRated(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [moviesData, tvShowsData] = await Promise.all([
        tmdbService.getTopRated('movie'),
        tmdbService.getTopRated('tv'),
      ]);

      setTopRated({
        movies: (moviesData?.results as TMDBMovie[]) || [],
        tvShows: (tvShowsData?.results as TMDBTVShow[]) || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setTopRated(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  useEffect(() => {
    fetchTopRated();
  }, [fetchTopRated]);

  return { ...topRated, refetch: fetchTopRated };
}

export function useSearch() {
  const [searchResults, setSearchResults] = useState<{
    results: (TMDBMovie | TMDBTVShow)[];
    loading: boolean;
    error: string | null;
    query: string;
  }>({
    results: [],
    loading: false,
    error: null,
    query: '',
  });

  const search = useCallback(async (query: string, type: 'movie' | 'tv' | 'multi' = 'multi') => {
    if (!query.trim()) {
      setSearchResults({ results: [], loading: false, error: null, query: '' });
      return;
    }

    setSearchResults(prev => ({ ...prev, loading: true, error: null, query }));

    try {
      const data = await tmdbService.search(query, type);
      setSearchResults({
        results: data?.results || [],
        loading: false,
        error: null,
        query,
      });
    } catch (error) {
      setSearchResults(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error de búsqueda',
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults({ results: [], loading: false, error: null, query: '' });
  }, []);

  return { ...searchResults, search, clearSearch };
}

export default useTMDB;
