/**
 * CineMatch - Application Configuration
 * 
 * SECURITY ARCHITECTURE:
 * TMDB API credentials are authenticated securely on the server via `.env`.
 * The browser frontend communicates strictly through safe `/api` proxy endpoints,
 * ensuring the secret API key is NEVER exposed to client-side code, network logs,
 * or browser developer tools.
 */

const CONFIG = {
  // Local Node.js Express backend proxy base URL
  API_BASE_URL: '/api',

  // TMDB Public Image CDN (does not require authentication keys)
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',

  // Image resolution presets
  POSTER_SIZES: {
    thumb: '/w185',
    medium: '/w342',
    large: '/w500',
    original: '/original'
  },
  BACKDROP_SIZES: {
    medium: '/w780',
    large: '/w1280',
    original: '/original'
  },
  PROFILE_SIZES: {
    small: '/w185',
    medium: '/h632'
  },

  // Storage keys for localStorage persistence
  STORAGE_KEYS: {
    WATCHLIST: 'cinematch_watchlist',
    LIKES: 'cinematch_liked_movies',
    DISLIKES: 'cinematch_disliked_movies',
    GENRE_PREFERENCES: 'cinematch_favorite_genres',
    GENRES_CACHE: 'cinematch_cached_genres'
  },

  // Recommendation engine scoring weights
  RECOMMENDER_WEIGHTS: {
    EXPLICIT_GENRE_MATCH: 4.0,   // Bonus per genre matching user's selected favorites
    LIKED_GENRE_MATCH: 3.0,      // Bonus per genre matching movies user has liked
    RATING_WEIGHT: 0.2,          // Factor multiplied by TMDB vote_average (0-10 -> 0-2.0)
    POPULARITY_MAX_BONUS: 2.0    // Maximum logarithmic popularity bonus
  },

  // App settings
  SEARCH_DEBOUNCE_MS: 350,
  DEFAULT_LANGUAGE: 'en-US'
};

// Freeze configuration to prevent accidental runtime mutations
Object.freeze(CONFIG.POSTER_SIZES);
Object.freeze(CONFIG.BACKDROP_SIZES);
Object.freeze(CONFIG.PROFILE_SIZES);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.RECOMMENDER_WEIGHTS);
