/**
 * Custom React Hooks for Neo4j Database Operations
 * 
 * These hooks provide a React-friendly interface to the neo4jService,
 * handling loading states, errors, and component lifecycle automatically.
 */

import { useState, useCallback, useEffect } from 'react';
import * as neo4jService from '../services/neo4jService';

/**
 * Hook for fetching data from the database
 * Automatically handles loading, data, and error states
 * 
 * @param {Function} fetchFn - The async function to call (from neo4jService)
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {boolean} autoFetch - Whether to fetch on mount (default: true)
 * @returns {Object} - { data, loading, error, refetch }
 * 
 * @example
 * const { data: seasons, loading, error, refetch } = useFetchData(
 *   () => neo4jService.getAllSeasons(),
 *   [],
 *   true
 * );
 */
export const useFetchData = (fetchFn, dependencies = [], autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Hook for creating/updating data in the database
 * Provides a function to execute the mutation and tracks its state
 * 
 * @param {Function} mutationFn - The async function to call (from neo4jService)
 * @param {Function} onSuccess - Callback on successful mutation
 * @param {Function} onError - Callback on mutation error
 * @returns {Object} - { mutate, loading, error, data, success }
 * 
 * @example
 * const { mutate: createSeason, loading } = useMutation(
 *   (params) => neo4jService.createSeason(...params),
 *   () => alert('Season created!'),
 *   (err) => alert(`Error: ${err}`)
 * );
 * 
 * const handleSubmit = async () => {
 *   await createSeason([2024, 46]);
 * };
 */
export const useMutation = (mutationFn, onSuccess, onError) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const result = await mutationFn(...args);
        setData(result);
        setSuccess(true);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        if (onError) onError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError]
  );

  return {
    mutate,
    loading,
    error,
    data,
    success,
  };
};

/**
 * Hook for managing form state with validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Function to call on form submission
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} - Form state and handlers
 * 
 * @example
 * const { values, errors, handleChange, handleSubmit } = useForm(
 *   { season_number: '', year: '' },
 *   async (values) => {
 *     await neo4jService.createSeason(values.season_number, values.year);
 *   },
 *   {
 *     season_number: (val) => val ? '' : 'Season number is required',
 *     year: (val) => val ? '' : 'Year is required'
 *   }
 * );
 */
export const useForm = (initialValues, onSubmit, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name, value) => {
      if (validationRules[name]) {
        return validationRules[name](value);
      }
      return '';
    },
    [validationRules]
  );

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Real-time validation
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, newValue),
      }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  }, [validateField]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      
      // Validate all fields
      const newErrors = {};
      Object.keys(validationRules).forEach(name => {
        newErrors[name] = validateField(name, values[name]);
      });
      setErrors(newErrors);
      setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

      // Check if there are any errors
      if (Object.values(newErrors).some(error => error)) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        setValues(initialValues);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationRules, validateField, onSubmit, initialValues]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setErrors,
  };
};

/**
 * Hook for fetching player data with all relationships
 * 
 * @param {string} firstName - Player's first name
 * @param {string} lastName - Player's last name
 * @returns {Object} - { player, tribe, season, alliances, fantasyTeam, loading, error }
 */
export const usePlayerDetails = (firstName, lastName) => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await neo4jService.getPlayerDetails(firstName, lastName);
        setPlayerData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching player:', err);
      } finally {
        setLoading(false);
      }
    };

    if (firstName && lastName) {
      fetchPlayer();
    }
  }, [firstName, lastName]);

  return {
    player: playerData?.player || null,
    tribe: playerData?.tribe || null,
    season: playerData?.season || null,
    alliances: playerData?.alliances || [],
    fantasyTeam: playerData?.fantasyTeam || null,
    loading,
    error,
  };
};

/**
 * Hook for fetching season overview data
 * 
 * @param {number} seasonNumber - Season number
 * @returns {Object} - { overview, loading, error, refetch }
 */
export const useSeasonOverview = (seasonNumber) => {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await neo4jService.getSeasonOverview(seasonNumber);
      setOverview(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching season overview:', err);
    } finally {
      setLoading(false);
    }
  }, [seasonNumber]);

  useEffect(() => {
    if (seasonNumber) {
      fetchOverview();
    }
  }, [seasonNumber, fetchOverview]);

  return {
    overview,
    loading,
    error,
    refetch: fetchOverview,
  };
};

/**
 * Hook for fetching fantasy team leaderboard
 * 
 * @param {number} refreshInterval - How often to refresh in ms (0 = no auto-refresh)
 * @returns {Object} - { leaderboard, loading, error, refetch }
 */
export const useLeaderboard = (refreshInterval = 0) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await neo4jService.getFantasyTeamLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchLeaderboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
};

/**
 * Hook for managing async operations with caching
 * Caches results to avoid redundant queries
 * 
 * @param {string} cacheKey - Unique key for this cache entry
 * @param {Function} fetchFn - The async function to call
 * @param {number} cacheDurationMs - How long to cache results (default: 5 minutes)
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useCachedData = (cacheKey, fetchFn, cacheDurationMs = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheTime, setCacheTime] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = cacheTime && (now - cacheTime) < cacheDurationMs;

    if (!forceRefresh && data !== null && isCacheValid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      setCacheTime(now);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, data, cacheTime, cacheDurationMs]);

  useEffect(() => {
    fetchData();
  }, [cacheKey]); // Only refetch if cache key changes

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for debounced search functionality
 * Useful for search inputs that query the database
 * 
 * @param {string} searchTerm - The search term
 * @param {Function} searchFn - Function to call with search term
 * @param {number} delayMs - Debounce delay in milliseconds (default: 300)
 * @returns {Object} - { results, loading, error, isSearching }
 */
export const useDebouncedSearch = (searchTerm, searchFn, delayMs = 300) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchFn(searchTerm);
        setResults(result || []);
      } catch (err) {
        setError(err.message);
        console.error('Search error:', err);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, delayMs, searchFn]);

  return {
    results,
    loading,
    error,
    isSearching,
  };
};
