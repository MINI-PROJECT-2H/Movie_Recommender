/**
 * CineMatch - Movie Recommendation System
 * Pure Vanilla JavaScript (ES6+) Architecture
 * 
 * Modules:
 * 1. StorageManager: localStorage state persistence for Watchlist, Likes, Preferences
 * 2. TMDBApi: Communicates securely with the Node.js /api backend proxy
 * 3. RecommendationEngine: Transparent content-based filtering algorithm
 * 4. UIManager: DOM manipulation, carousel controls, modals, and toasts
 * 5. App: Application orchestrator & event bindings
 */

'use strict';

/* ==========================================================================
   1. StorageManager: Local State Persistence
   ========================================================================== */
const StorageManager = {
  /**
   * Safe localStorage getter with JSON parsing
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.warn(`[Storage] Failed to read key "${key}":`, err);
      return defaultValue;
    }
  },

  /**
   * Safe localStorage setter with JSON serialization
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to write key "${key}":`, err);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to remove key "${key}":`, err);
      return false;
    }
  },

  /* --- Watchlist Management --- */
  getWatchlist() {
    return this.get(CONFIG.STORAGE_KEYS.WATCHLIST, []);
  },

  addToWatchlist(movie) {
    if (!movie || !movie.id) return false;
    const list = this.getWatchlist();
    if (!list.some(item => item.id === movie.id)) {
      const simplified = {
        id: movie.id,
        title: movie.title || movie.name || 'Untitled',
        poster_path: movie.poster_path || null,
        backdrop_path: movie.backdrop_path || null,
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || movie.first_air_date || '',
        genre_ids: movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []),
        overview: movie.overview || '',
        savedAt: Date.now()
      };
      list.unshift(simplified);
      this.set(CONFIG.STORAGE_KEYS.WATCHLIST, list);
      return true;
    }
    return false;
  },

  removeFromWatchlist(movieId) {
    const list = this.getWatchlist();
    const filtered = list.filter(item => item.id !== Number(movieId));
    this.set(CONFIG.STORAGE_KEYS.WATCHLIST, filtered);
    return true;
  },

  isInWatchlist(movieId) {
    const list = this.getWatchlist();
    return list.some(item => item.id === Number(movieId));
  },

  clearWatchlist() {
    this.set(CONFIG.STORAGE_KEYS.WATCHLIST, []);
  },

  /* --- Likes Management --- */
  getLikes() {
    return this.get(CONFIG.STORAGE_KEYS.LIKES, []);
  },

  addLike(movie) {
    if (!movie || !movie.id) return false;
    const likes = this.getLikes();
    this.removeDislike(movie.id);

    if (!likes.some(m => m.id === movie.id)) {
      likes.unshift({
        id: movie.id,
        title: movie.title || 'Untitled',
        genre_ids: movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []),
        vote_average: movie.vote_average || 0
      });
      this.set(CONFIG.STORAGE_KEYS.LIKES, likes);
      return true;
    }
    return false;
  },

  removeLike(movieId) {
    const likes = this.getLikes();
    const filtered = likes.filter(m => m.id !== Number(movieId));
    this.set(CONFIG.STORAGE_KEYS.LIKES, filtered);
    return true;
  },

  isLiked(movieId) {
    return this.getLikes().some(m => m.id === Number(movieId));
  },

  /* --- Dislikes Management --- */
  getDislikes() {
    return this.get(CONFIG.STORAGE_KEYS.DISLIKES, []);
  },

  addDislike(movieId) {
    const id = Number(movieId);
    const dislikes = this.getDislikes();
    this.removeLike(id);

    if (!dislikes.includes(id)) {
      dislikes.push(id);
      this.set(CONFIG.STORAGE_KEYS.DISLIKES, dislikes);
      return true;
    }
    return false;
  },

  removeDislike(movieId) {
    const id = Number(movieId);
    const dislikes = this.getDislikes();
    this.set(CONFIG.STORAGE_KEYS.DISLIKES, dislikes.filter(d => d !== id));
    return true;
  },

  isDisliked(movieId) {
    return this.getDislikes().includes(Number(movieId));
  },

  /* --- Favorite Genre Preferences --- */
  getFavoriteGenres() {
    return this.get(CONFIG.STORAGE_KEYS.GENRE_PREFERENCES, []);
  },

  toggleFavoriteGenre(genreId) {
    const id = Number(genreId);
    let favs = this.getFavoriteGenres();
    if (favs.includes(id)) {
      favs = favs.filter(g => g !== id);
    } else {
      favs.push(id);
    }
    this.set(CONFIG.STORAGE_KEYS.GENRE_PREFERENCES, favs);
    return favs;
  },

  /* --- Genre Cache --- */
  getCachedGenres() {
    return this.get(CONFIG.STORAGE_KEYS.GENRES_CACHE, null);
  },

  setCachedGenres(genres) {
    return this.set(CONFIG.STORAGE_KEYS.GENRES_CACHE, genres);
  }
};


/* ==========================================================================
   2. TMDBApi: Communicates with Local Express /api Proxy
   ========================================================================== */
const TMDBApi = {
  // In-memory cache for fast UI updates
  cache: new Map(),

  // Request counter to avoid search race conditions
  lastSearchRequestId: 0,

  /**
   * Build URL targeting local /api proxy endpoints
   * Secret TMDB_API_KEY is never transmitted by or known to the browser.
   */
  buildUrl(endpoint, params = {}) {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    return `${CONFIG.API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Centralized HTTP fetch handler with defensive error handling
   */
  async request(endpoint, params = {}, useCache = true) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url);
      let data = {};
      try {
        data = await response.json();
      } catch (_) {}

      if (!response.ok) {
        const err = new Error(data.error || data.message || `API Error: HTTP ${response.status}`);
        err.status = response.status;
        err.code = data.code || (response.status === 503 ? 'KEY_MISSING' : response.status === 401 ? 'INVALID_KEY' : response.status === 429 ? 'RATE_LIMITED' : 'HTTP_ERROR');
        throw err;
      }

      if (useCache) {
        this.cache.set(cacheKey, data);
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const netErr = new Error('Cannot connect to CineMatch backend. Ensure the server is running ("npm start").');
        netErr.code = 'NETWORK_ERROR';
        throw netErr;
      }
      throw err;
    }
  },

  /**
   * Check status of server-side TMDB_API_KEY configuration
   */
  async checkBackendStatus() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/status`);
      const data = await res.json().catch(() => ({}));
      return {
        ok: data.ok === true,
        keyConfigured: data.keyConfigured === true,
        message: data.message || (res.ok ? 'Backend proxy online.' : 'Configuration needed.')
      };
    } catch (err) {
      return {
        ok: false,
        keyConfigured: false,
        message: 'Unable to reach backend server. Run "npm start" on port 3000.'
      };
    }
  },

  /**
   * Fetch official genre list via /api/genres
   */
  async getGenres() {
    const cached = StorageManager.getCachedGenres();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const data = await this.request('/genres');
    if (data && data.genres) {
      StorageManager.setCachedGenres(data.genres);
      return data.genres;
    }
    return [];
  },

  /**
   * Fetch weekly trending movies via /api/trending
   */
  async getTrending(page = 1) {
    return this.request('/trending', { page });
  },

  /**
   * Fetch popular movies via /api/popular
   */
  async getPopular(page = 1) {
    return this.request('/popular', { page });
  },

  /**
   * Fetch top rated movies via /api/top_rated
   */
  async getTopRated(page = 1) {
    return this.request('/top_rated', { page });
  },

  /**
   * Discover movies with filters via /api/discover
   */
  async discoverMovies({ genreId = '', sortBy = 'popularity.desc', page = 1 } = {}) {
    const params = {
      sort_by: sortBy,
      page
    };

    if (genreId) {
      params.with_genres = genreId;
    }

    return this.request('/discover', params);
  },

  /**
   * Search movies by title with race condition prevention via /api/search
   */
  async searchMovies(query, page = 1) {
    const requestId = ++this.lastSearchRequestId;
    const data = await this.request('/search', {
      query: query.trim(),
      page
    }, false);

    if (requestId !== this.lastSearchRequestId) {
      return null;
    }
    return data;
  },

  /**
   * Fetch comprehensive movie details, credits, videos, and recommendations via /api/movie/:id
   */
  async getMovieDetails(movieId) {
    return this.request(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,recommendations,similar'
    });
  },

  /**
   * Standalone credits endpoint via /api/movie/:id/credits
   */
  async getMovieCredits(movieId) {
    return this.request(`/movie/${movieId}/credits`);
  },

  /**
   * Standalone videos endpoint via /api/movie/:id/videos
   */
  async getMovieVideos(movieId) {
    return this.request(`/movie/${movieId}/videos`);
  },

  /**
   * Standalone recommendations endpoint via /api/movie/:id/recommendations
   */
  async getMovieRecommendations(movieId) {
    return this.request(`/movie/${movieId}/recommendations`);
  },

  /**
   * Helper to format poster image URL from TMDB CDN
   */
  getPosterUrl(path, size = 'large') {
    if (!path) return null;
    const sizePath = CONFIG.POSTER_SIZES[size] || CONFIG.POSTER_SIZES.large;
    return `${CONFIG.IMAGE_BASE_URL}${sizePath}${path}`;
  },

  /**
   * Helper to format backdrop image URL from TMDB CDN
   */
  getBackdropUrl(path, size = 'large') {
    if (!path) return null;
    const sizePath = CONFIG.BACKDROP_SIZES[size] || CONFIG.BACKDROP_SIZES.large;
    return `${CONFIG.IMAGE_BASE_URL}${sizePath}${path}`;
  },

  /**
   * Helper to format actor profile image URL from TMDB CDN
   */
  getProfileUrl(path, size = 'small') {
    if (!path) return null;
    const sizePath = CONFIG.PROFILE_SIZES[size] || CONFIG.PROFILE_SIZES.small;
    return `${CONFIG.IMAGE_BASE_URL}${sizePath}${path}`;
  }
};


/* ==========================================================================
   3. RecommendationEngine: Content-Based Filtering & Weighted Scoring
   ========================================================================== */
const RecommendationEngine = {
  /**
   * Compute personalized recommendations from a candidate movie pool
   * 
   * Scoring Breakdown:
   * 1. Explicit Genre Match: +4.0 points per match with user's selected preferences
   * 2. Liked Movies Association: +3.0 points * (frequency / totalLikes)
   * 3. Rating Quality Factor: (vote_average / 10) * 2.0 (up to +2.0)
   * 4. Logarithmic Popularity Factor: min(2.0, log10(popularity + 1)) (up to +2.0)
   * 5. Exclude already liked and disliked movies
   * 6. Generate human-readable explanation
   */
  generateRecommendations(candidates, genresMap = {}) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return [];
    }

    const favoriteGenres = new Set(StorageManager.getFavoriteGenres());
    const likedMovies = StorageManager.getLikes();
    const dislikedMovieIds = new Set(StorageManager.getDislikes());
    const likedMovieIds = new Set(likedMovies.map(m => m.id));

    // Calculate genre frequencies in liked movies
    const likedGenreFrequency = new Map();
    likedMovies.forEach(movie => {
      const gIds = movie.genre_ids || [];
      gIds.forEach(id => {
        likedGenreFrequency.set(id, (likedGenreFrequency.get(id) || 0) + 1);
      });
    });

    const totalLikedCount = Math.max(1, likedMovies.length);
    const weights = CONFIG.RECOMMENDER_WEIGHTS;

    // Filter and score candidates
    const scoredList = [];
    const seenIds = new Set();

    for (const movie of candidates) {
      if (!movie || !movie.id) continue;
      if (seenIds.has(movie.id)) continue;
      seenIds.add(movie.id);

      // Exclude disliked movies
      if (dislikedMovieIds.has(movie.id)) continue;

      // Exclude already liked movies
      if (likedMovieIds.has(movie.id)) continue;

      // Exclude adult titles
      if (movie.adult === true) continue;

      const movieGenreIds = movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []);

      let explicitGenreScore = 0;
      let matchedPrefGenres = [];

      let likedAssociationScore = 0;
      let matchedLikedGenres = [];

      // 1. Explicit Genre Matching
      movieGenreIds.forEach(gId => {
        if (favoriteGenres.has(gId)) {
          explicitGenreScore += weights.EXPLICIT_GENRE_MATCH;
          if (genresMap[gId]) {
            matchedPrefGenres.push(genresMap[gId]);
          }
        }

        // 2. Liked Movies Association
        if (likedGenreFrequency.has(gId)) {
          const freq = likedGenreFrequency.get(gId);
          likedAssociationScore += weights.LIKED_GENRE_MATCH * (freq / totalLikedCount);
          if (genresMap[gId] && !matchedLikedGenres.includes(genresMap[gId])) {
            matchedLikedGenres.push(genresMap[gId]);
          }
        }
      });

      // 3. TMDB Rating Factor
      const rating = typeof movie.vote_average === 'number' ? movie.vote_average : 0;
      const ratingScore = (rating / 10.0) * (weights.RATING_WEIGHT * 10);

      // 4. Popularity Bonus (logarithmic)
      const popularity = typeof movie.popularity === 'number' ? movie.popularity : 0;
      const popularityScore = Math.min(
        weights.POPULARITY_MAX_BONUS,
        Math.log10(Math.max(1, popularity)) * 0.7
      );

      // Total raw score
      const totalScore = explicitGenreScore + likedAssociationScore + ratingScore + popularityScore;

      // Generate recommendation explanation
      let reason = 'Curated recommendation';
      if (matchedPrefGenres.length > 0) {
        reason = `Matches your ${matchedPrefGenres.slice(0, 2).join(' & ')} preference`;
      } else if (matchedLikedGenres.length > 0) {
        reason = `Similar to movies you liked (${matchedLikedGenres[0]})`;
      } else if (rating >= 8.0) {
        reason = `Critically acclaimed (${rating.toFixed(1)}/10)`;
      } else if (popularity > 80) {
        reason = 'Trending among moviegoers';
      }

      // Calculate realistic match percentage for Netflix badge (75% to 99%)
      const baseMatch = 72;
      const normalizedBoost = Math.min(26, Math.round(totalScore * 2.2));
      const matchPercentage = Math.min(99, baseMatch + normalizedBoost);

      scoredList.push({
        ...movie,
        recommenderScore: totalScore,
        matchPercentage,
        recommendationReason: reason
      });
    }

    // Sort descending by calculated score, then by TMDB vote average
    scoredList.sort((a, b) => {
      if (b.recommenderScore !== a.recommenderScore) {
        return b.recommenderScore - a.recommenderScore;
      }
      return (b.vote_average || 0) - (a.vote_average || 0);
    });

    return scoredList;
  }
};


/* ==========================================================================
   4. UIManager: Presentation Layer & Event Handlers
   ========================================================================== */
const UIManager = {
  genresMap: {},
  genresList: [],
  currentDiscoverPage: 1,
  totalDiscoverPages: 1,
  isSearching: false,
  activeSearchQuery: '',
  selectedDiscoverGenre: '',
  selectedSort: 'popularity.desc',
  searchDebounceTimer: null,
  activeMovieInModal: null,

  /**
   * Initialize DOM elements and cache references
   */
  initElements() {
    this.dom = {
      navbar: document.getElementById('navbar'),
      navLinks: document.querySelectorAll('.nav-link'),
      navWatchlistCount: document.getElementById('nav-watchlist-count'),
      mobileWatchlistCount: document.getElementById('mobile-watchlist-count'),
      mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
      mobileNavDrawer: document.getElementById('mobile-nav-drawer'),
      globalSearchInput: document.getElementById('global-search-input'),
      searchClearBtn: document.getElementById('search-clear-btn'),
      mobileApiBtn: document.getElementById('mobile-api-btn'),
      missingKeyBanner: document.getElementById('missing-key-banner'),
      bannerSetupBtn: document.getElementById('banner-setup-btn'),

      // Hero
      heroBackdrop: document.getElementById('hero-backdrop'),
      heroRatingVal: document.getElementById('hero-rating-val'),
      heroYear: document.getElementById('hero-year'),
      heroTitle: document.getElementById('hero-title'),
      heroGenres: document.getElementById('hero-genres'),
      heroOverview: document.getElementById('hero-overview'),
      heroExploreBtn: document.getElementById('hero-explore-btn'),
      heroMoreInfoBtn: document.getElementById('hero-more-info-btn'),
      heroWatchlistBtn: document.getElementById('hero-watchlist-btn'),

      // Carousels
      trendingTrack: document.getElementById('trending-track'),
      trendingPrev: document.getElementById('trending-prev'),
      trendingNext: document.getElementById('trending-next'),
      popularTrack: document.getElementById('popular-track'),
      popularPrev: document.getElementById('popular-prev'),
      popularNext: document.getElementById('popular-next'),

      // Recommendations
      recsGenreChips: document.getElementById('recs-genre-chips'),
      recommendationsGrid: document.getElementById('recommendations-grid'),
      refreshRecsBtn: document.getElementById('refresh-recs-btn'),
      algoInfoBtn: document.getElementById('algo-info-btn'),
      recsLikesStat: document.getElementById('recs-likes-stat'),
      recsGenresStat: document.getElementById('recs-genres-stat'),

      // Discover
      genreSelect: document.getElementById('genre-select'),
      sortSelect: document.getElementById('sort-select'),
      resetFiltersBtn: document.getElementById('reset-filters-btn'),
      discoverGrid: document.getElementById('discover-grid'),
      discoverResultsCount: document.getElementById('discover-results-count'),
      loadMoreBtn: document.getElementById('load-more-btn'),
      activeFiltersRow: document.getElementById('active-filters-row'),
      activeFilterTag: document.getElementById('active-filter-tag'),

      // Watchlist
      watchlistGrid: document.getElementById('watchlist-grid'),
      clearWatchlistBtn: document.getElementById('clear-watchlist-btn'),

      // Movie Modal
      movieModal: document.getElementById('movie-modal'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      modalBackdropImg: document.getElementById('modal-backdrop-img'),
      modalVideoContainer: document.getElementById('modal-video-container'),
      modalPlayTrailerBtn: document.getElementById('modal-play-trailer-btn'),
      modalMovieTitle: document.getElementById('modal-movie-title'),
      modalTagline: document.getElementById('modal-tagline'),
      modalRatingVal: document.getElementById('modal-rating-val'),
      modalVotes: document.getElementById('modal-votes'),
      modalReleaseDate: document.getElementById('modal-release-date'),
      modalRuntime: document.getElementById('modal-runtime'),
      modalLanguage: document.getElementById('modal-language'),
      modalGenres: document.getElementById('modal-genres'),
      modalOverview: document.getElementById('modal-overview'),
      modalCastRow: document.getElementById('modal-cast-row'),
      modalSimilarRow: document.getElementById('modal-similar-row'),
      modalWatchlistBtn: document.getElementById('modal-watchlist-btn'),
      modalWatchlistText: document.getElementById('modal-watchlist-text'),
      modalLikeBtn: document.getElementById('modal-like-btn'),
      modalDislikeBtn: document.getElementById('modal-dislike-btn'),

      // API Modal
      apiModal: document.getElementById('api-modal'),
      apiModalCloseBtn: document.getElementById('api-modal-close-btn'),
      checkBackendStatusBtn: document.getElementById('check-backend-status-btn'),
      backendStatusBadge: document.getElementById('backend-status-badge'),
      apiValidationMsg: document.getElementById('api-validation-msg'),

      // Algorithm Modal
      algoModal: document.getElementById('algo-modal'),
      algoModalCloseBtn: document.getElementById('algo-modal-close-btn'),

      // Toast
      toastContainer: document.getElementById('toast-container')
    };
  },

  /**
   * Escape untrusted text to prevent XSS injection
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Show animated floating toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span>${this.escapeHtml(message)}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  /**
   * Render movie card HTML string
   */
  createMovieCardHtml(movie, isRec = false) {
    if (!movie) return '';

    const id = movie.id;
    const title = this.escapeHtml(movie.title || movie.name || 'Untitled');
    const posterUrl = TMDBApi.getPosterUrl(movie.poster_path, 'large');
    const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'NR';
    const releaseYear = (movie.release_date || movie.first_air_date || '').slice(0, 4) || '—';
    const inWatchlist = StorageManager.isInWatchlist(id);
    const isLiked = StorageManager.isLiked(id);

    const matchBadgeHtml = isRec && movie.matchPercentage
      ? `<div class="card-match-badge">${movie.matchPercentage}% Match</div>`
      : '';

    const recReasonHtml = isRec && movie.recommendationReason
      ? `<div class="card-rec-reason" title="${this.escapeHtml(movie.recommendationReason)}">${this.escapeHtml(movie.recommendationReason)}</div>`
      : '';

    const posterContent = posterUrl
      ? `<img src="${posterUrl}" alt="${title} Poster" class="card-poster" loading="lazy">`
      : `<div class="card-poster-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
           <span>${title}</span>
         </div>`;

    return `
      <article class="movie-card" data-movie-id="${id}" tabindex="0" role="button" aria-label="${title}">
        <div class="card-poster-wrapper">
          ${posterContent}
          ${matchBadgeHtml}
          <div class="card-rating-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" class="star-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>${rating}</span>
          </div>
          <div class="card-overlay-actions">
            <button class="card-action-btn card-watchlist-btn ${inWatchlist ? 'active' : ''}" data-action="toggle-watchlist" data-id="${id}" title="${inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}" aria-label="Toggle watchlist">
              <svg viewBox="0 0 24 24" fill="${inWatchlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <button class="card-action-btn card-like-btn ${isLiked ? 'active' : ''}" data-action="toggle-like" data-id="${id}" title="Like movie" aria-label="Like movie">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            </button>
            <button class="card-action-btn card-details-btn" data-action="open-modal" data-id="${id}" title="More Info" aria-label="View movie details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </button>
          </div>
        </div>
        <div class="card-info">
          <div class="card-title" title="${title}">${title}</div>
          <div class="card-meta">
            <span>${releaseYear}</span>
            <span>★ ${rating}</span>
          </div>
          ${recReasonHtml}
        </div>
      </article>
    `;
  },

  /**
   * Update Watchlist counters in Navigation
   */
  updateWatchlistCounters() {
    const list = StorageManager.getWatchlist();
    const count = list.length;
    this.dom.navWatchlistCount.textContent = count;
    this.dom.mobileWatchlistCount.textContent = count;

    this.dom.navWatchlistCount.classList.add('bump');
    setTimeout(() => this.dom.navWatchlistCount.classList.remove('bump'), 300);
  },

  /**
   * Update API Connection Status Indicator based on backend verification
   */
  updateApiStatusIndicator(status) {
    if (status && status.ok) {
      this.dom.missingKeyBanner.classList.add('hidden');
    } else {
      this.dom.missingKeyBanner.classList.remove('hidden');
    }
  },

  /**
   * Check live backend proxy status and update modal UI
   */
  async refreshBackendStatus() {
    const badge = this.dom.backendStatusBadge;
    const msgEl = this.dom.apiValidationMsg;
    const checkBtn = this.dom.checkBackendStatusBtn;
    const spinner = checkBtn.querySelector('.btn-spinner');
    const text = checkBtn.querySelector('.btn-text');

    spinner.classList.remove('hidden');
    text.textContent = 'Testing connection...';
    checkBtn.disabled = true;

    try {
      const status = await TMDBApi.checkBackendStatus();
      this.updateApiStatusIndicator(status);

      msgEl.classList.remove('hidden');
      if (status.ok) {
        badge.className = 'badge text-success';
        badge.textContent = '● Connected (.env configured)';
        msgEl.className = 'api-msg success';
        msgEl.textContent = '✓ TMDB API Key authenticated successfully via Node backend proxy!';
      } else {
        badge.className = 'badge text-danger';
        badge.textContent = status.keyConfigured ? '● Authentication Failed' : '● Key Not Configured';
        msgEl.className = 'api-msg error';
        msgEl.textContent = status.message;
      }
      return status;
    } finally {
      spinner.classList.add('hidden');
      text.textContent = 'Test Backend Connection';
      checkBtn.disabled = false;
    }
  },

  /**
   * Populate Hero Section with a high-rated movie
   */
  renderHero(movie) {
    if (!movie) return;
    this.featuredHeroMovie = movie;

    const title = movie.title || movie.name || 'Featured Movie';
    const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : '8.4';
    const year = (movie.release_date || movie.first_air_date || '').slice(0, 4) || '2026';
    const overview = movie.overview || 'Explore trending stories, discover new favorites, and enjoy personalized suggestions.';

    const backdropUrl = TMDBApi.getBackdropUrl(movie.backdrop_path, 'large');
    if (backdropUrl) {
      this.dom.heroBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    }

    this.dom.heroTitle.textContent = title;
    this.dom.heroRatingVal.textContent = rating;
    this.dom.heroYear.textContent = year;
    this.dom.heroOverview.textContent = overview;

    // Render genre tags in Hero
    const genreIds = movie.genre_ids || [];
    this.dom.heroGenres.innerHTML = genreIds
      .map(id => this.genresMap[id] ? `<span class="genre-pill">${this.escapeHtml(this.genresMap[id])}</span>` : '')
      .join('');

    // Update hero watchlist button
    const inWatchlist = StorageManager.isInWatchlist(movie.id);
    if (inWatchlist) {
      this.dom.heroWatchlistBtn.classList.add('active');
      this.dom.heroWatchlistBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    } else {
      this.dom.heroWatchlistBtn.classList.remove('active');
      this.dom.heroWatchlistBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    }
  },

  /**
   * Render horizontal carousel tracks
   */
  renderCarousel(trackElement, movies) {
    if (!movies || movies.length === 0) {
      trackElement.innerHTML = `<div class="empty-state"><p class="empty-state-text">No movies found.</p></div>`;
      return;
    }

    trackElement.innerHTML = movies
      .filter(m => m.poster_path)
      .map(movie => this.createMovieCardHtml(movie))
      .join('');
  },

  /**
   * Attach carousel scrolling controls
   */
  setupCarouselControls(trackElement, prevBtn, nextBtn) {
    const scrollAmount = 600;

    const updateArrows = () => {
      const scrollLeft = trackElement.scrollLeft;
      const maxScroll = trackElement.scrollWidth - trackElement.clientWidth - 5;
      prevBtn.disabled = scrollLeft <= 5;
      nextBtn.disabled = scrollLeft >= maxScroll;
    };

    prevBtn.addEventListener('click', () => {
      trackElement.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      trackElement.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    trackElement.addEventListener('scroll', updateArrows, { passive: true });
    setTimeout(updateArrows, 400);
  },

  /**
   * Render genre preference chips in "For You" section
   */
  renderGenrePreferenceChips(genres) {
    const selected = new Set(StorageManager.getFavoriteGenres());

    this.dom.recsGenreChips.innerHTML = genres
      .map(genre => {
        const isSelected = selected.has(genre.id);
        return `
          <button 
            type="button" 
            class="genre-chip ${isSelected ? 'selected' : ''}" 
            data-genre-id="${genre.id}"
            aria-pressed="${isSelected}">
            ${this.escapeHtml(genre.name)}
          </button>
        `;
      })
      .join('');
  },

  /**
   * Render genre dropdown options in Discover section
   */
  renderGenreDropdown(genres) {
    this.dom.genreSelect.innerHTML = `
      <option value="">All Genres</option>
      ${genres.map(g => `<option value="${g.id}">${this.escapeHtml(g.name)}</option>`).join('')}
    `;
  },

  /**
   * Render Discover section movies (with append support for Load More)
   */
  renderDiscoverGrid(movies, append = false) {
    if (!append) {
      this.dom.discoverGrid.innerHTML = '';
    }

    if (!movies || movies.length === 0) {
      if (!append) {
        this.dom.discoverGrid.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <h3 class="empty-state-title">No movies found</h3>
            <p class="empty-state-text">Try tweaking your search term, clearing genre filters, or choosing a different sorting option.</p>
            <button class="btn btn-secondary btn-sm" id="empty-reset-btn">Reset All Filters</button>
          </div>
        `;
        const resetBtn = document.getElementById('empty-reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.handleResetFilters());
      }
      this.dom.loadMoreBtn.classList.add('hidden');
      return;
    }

    const cardsHtml = movies.map(movie => this.createMovieCardHtml(movie)).join('');

    if (append) {
      this.dom.discoverGrid.insertAdjacentHTML('beforeend', cardsHtml);
    } else {
      this.dom.discoverGrid.innerHTML = cardsHtml;
    }

    if (this.currentDiscoverPage < this.totalDiscoverPages) {
      this.dom.loadMoreBtn.classList.remove('hidden');
    } else {
      this.dom.loadMoreBtn.classList.add('hidden');
    }
  },

  /**
   * Render Personalized Recommendations Grid
   */
  renderRecommendations(candidates) {
    const scoredRecs = RecommendationEngine.generateRecommendations(candidates, this.genresMap);

    const likesCount = StorageManager.getLikes().length;
    const favGenresCount = StorageManager.getFavoriteGenres().length;
    this.dom.recsLikesStat.textContent = `${likesCount} movie${likesCount === 1 ? '' : 's'} liked`;
    this.dom.recsGenresStat.textContent = `${favGenresCount} genre${favGenresCount === 1 ? '' : 's'} selected`;

    if (!scoredRecs || scoredRecs.length === 0) {
      this.dom.recommendationsGrid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          <h3 class="empty-state-title">Train Your CineMatch Algorithm</h3>
          <p class="empty-state-text">Select your preferred genres above and like movies across the site to generate personalized content-based suggestions.</p>
        </div>
      `;
      return;
    }

    const topRecs = scoredRecs.slice(0, 12);
    this.dom.recommendationsGrid.innerHTML = topRecs
      .map(movie => this.createMovieCardHtml(movie, true))
      .join('');
  },

  /**
   * Render Saved Watchlist Section
   */
  renderWatchlist() {
    const list = StorageManager.getWatchlist();

    if (!list || list.length === 0) {
      this.dom.watchlistGrid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <h3 class="empty-state-title">Your Watchlist is Empty</h3>
          <p class="empty-state-text">Browse trending movies, search your favorite directors, and click the heart icon on any card to save titles for later.</p>
          <a href="#discover-section" class="btn btn-primary btn-sm">Explore Discover Catalog</a>
        </div>
      `;
      this.dom.clearWatchlistBtn.classList.add('hidden');
      return;
    }

    this.dom.clearWatchlistBtn.classList.remove('hidden');
    this.dom.watchlistGrid.innerHTML = list
      .map(movie => this.createMovieCardHtml(movie))
      .join('');
  },

  /**
   * Open and populate Movie Details Modal
   */
  async openMovieModal(movieId) {
    if (!movieId) return;

    this.dom.movieModal.classList.remove('hidden');
    this.dom.movieModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    this.dom.modalVideoContainer.innerHTML = '';
    this.dom.modalVideoContainer.classList.add('hidden');
    this.dom.modalPlayTrailerBtn.classList.remove('hidden');

    try {
      const details = await TMDBApi.getMovieDetails(movieId);
      this.activeMovieInModal = details;

      const backdropUrl = TMDBApi.getBackdropUrl(details.backdrop_path, 'large');
      if (backdropUrl) {
        this.dom.modalBackdropImg.style.backgroundImage = `url('${backdropUrl}')`;
      } else {
        this.dom.modalBackdropImg.style.backgroundImage = 'none';
        this.dom.modalBackdropImg.style.backgroundColor = '#181818';
      }

      this.dom.modalMovieTitle.textContent = details.title || details.name || 'Untitled';
      this.dom.modalTagline.textContent = details.tagline || '';

      const rating = typeof details.vote_average === 'number' ? details.vote_average.toFixed(1) : 'NR';
      this.dom.modalRatingVal.textContent = rating;
      this.dom.modalVotes.textContent = details.vote_count ? `(${details.vote_count.toLocaleString()} votes)` : '';
      this.dom.modalReleaseDate.textContent = (details.release_date || '').slice(0, 4) || '—';

      if (details.runtime && details.runtime > 0) {
        const hours = Math.floor(details.runtime / 60);
        const mins = details.runtime % 60;
        this.dom.modalRuntime.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        this.dom.modalRuntime.classList.remove('hidden');
      } else {
        this.dom.modalRuntime.classList.add('hidden');
      }

      this.dom.modalLanguage.textContent = (details.original_language || 'EN').toUpperCase();

      if (details.genres && details.genres.length > 0) {
        this.dom.modalGenres.innerHTML = details.genres
          .map(g => `<span class="genre-pill">${this.escapeHtml(g.name)}</span>`)
          .join('');
      } else {
        this.dom.modalGenres.innerHTML = '';
      }

      this.dom.modalOverview.textContent = details.overview || 'No synopsis provided for this title.';

      // Official Trailer Setup
      const videos = details.videos && details.videos.results ? details.videos.results : [];
      const trailer = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos[0];

      if (trailer && trailer.key) {
        this.dom.modalPlayTrailerBtn.classList.remove('hidden');
        this.dom.modalPlayTrailerBtn.onclick = () => {
          this.dom.modalVideoContainer.innerHTML = `
            <iframe 
              src="https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0" 
              title="${this.escapeHtml(details.title)} Official Trailer" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          `;
          this.dom.modalVideoContainer.classList.remove('hidden');
          this.dom.modalPlayTrailerBtn.classList.add('hidden');
        };
      } else {
        this.dom.modalPlayTrailerBtn.classList.add('hidden');
      }

      this.updateModalActionButtons(details.id);

      // Cast list
      const cast = details.credits && details.credits.cast ? details.credits.cast.slice(0, 8) : [];
      if (cast.length > 0) {
        this.dom.modalCastRow.innerHTML = cast
          .map(person => {
            const profileUrl = TMDBApi.getProfileUrl(person.profile_path, 'small');
            const avatarHtml = profileUrl
              ? `<img src="${profileUrl}" alt="${this.escapeHtml(person.name)}" class="cast-avatar" loading="lazy">`
              : `<div class="cast-avatar-fallback">${(person.name || '?').charAt(0)}</div>`;

            return `
              <div class="cast-card">
                ${avatarHtml}
                <div class="cast-name" title="${this.escapeHtml(person.name)}">${this.escapeHtml(person.name)}</div>
                <div class="cast-character" title="${this.escapeHtml(person.character || '')}">${this.escapeHtml(person.character || '')}</div>
              </div>
            `;
          })
          .join('');
      } else {
        this.dom.modalCastRow.innerHTML = '<span class="text-muted">Cast data not available.</span>';
      }

      // Similar movies row
      const similar = (details.recommendations && details.recommendations.results ? details.recommendations.results : [])
        .concat(details.similar && details.similar.results ? details.similar.results : [])
        .filter((m, idx, arr) => arr.findIndex(item => item.id === m.id) === idx && m.poster_path)
        .slice(0, 6);

      if (similar.length > 0) {
        this.dom.modalSimilarRow.innerHTML = similar
          .map(simMovie => this.createMovieCardHtml(simMovie))
          .join('');
      } else {
        this.dom.modalSimilarRow.innerHTML = '<span class="text-muted">No similar titles found.</span>';
      }

    } catch (err) {
      console.error('[Modal] Failed to load movie details:', err);
      this.showToast(err.message || 'Could not load movie details.', 'warning');
      this.closeMovieModal();
    }
  },

  /**
   * Update modal interactive buttons (Watchlist, Like, Dislike)
   */
  updateModalActionButtons(movieId) {
    const id = Number(movieId);
    const inWatchlist = StorageManager.isInWatchlist(id);
    const isLiked = StorageManager.isLiked(id);
    const isDisliked = StorageManager.isDisliked(id);

    if (inWatchlist) {
      this.dom.modalWatchlistBtn.classList.add('active');
      this.dom.modalWatchlistText.textContent = 'In Watchlist';
    } else {
      this.dom.modalWatchlistBtn.classList.remove('active');
      this.dom.modalWatchlistText.textContent = 'Add to Watchlist';
    }

    if (isLiked) {
      this.dom.modalLikeBtn.classList.add('active-like');
    } else {
      this.dom.modalLikeBtn.classList.remove('active-like');
    }

    if (isDisliked) {
      this.dom.modalDislikeBtn.classList.add('active-dislike');
    } else {
      this.dom.modalDislikeBtn.classList.remove('active-dislike');
    }
  },

  /**
   * Close Movie Details Modal
   */
  closeMovieModal() {
    this.dom.movieModal.classList.add('hidden');
    this.dom.movieModal.setAttribute('aria-hidden', 'true');
    this.dom.modalVideoContainer.innerHTML = '';
    document.body.style.overflow = '';
    this.activeMovieInModal = null;
  },

  /**
   * Open API Settings Modal
   */
  openApiModal() {
    this.dom.apiModal.classList.remove('hidden');
    this.dom.apiModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.refreshBackendStatus();
  },

  /**
   * Close API Settings Modal
   */
  closeApiModal() {
    this.dom.apiModal.classList.add('hidden');
    this.dom.apiModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  /**
   * Open Recommendation Algorithm Info Modal
   */
  openAlgoModal() {
    this.dom.algoModal.classList.remove('hidden');
    this.dom.algoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Close Recommendation Algorithm Info Modal
   */
  closeAlgoModal() {
    this.dom.algoModal.classList.add('hidden');
    this.dom.algoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  /**
   * Reset all Discover filters & search
   */
  handleResetFilters() {
    this.dom.globalSearchInput.value = '';
    this.dom.searchClearBtn.classList.add('hidden');
    this.dom.genreSelect.value = '';
    this.dom.sortSelect.value = 'popularity.desc';
    this.selectedDiscoverGenre = '';
    this.selectedSort = 'popularity.desc';
    this.activeSearchQuery = '';
    this.isSearching = false;
    this.dom.activeFiltersRow.classList.add('hidden');
    this.currentDiscoverPage = 1;
    App.fetchDiscoverCatalog(1, false);
  }
};


/* ==========================================================================
   5. App: Application Controller & Orchestration
   ========================================================================== */
const App = {
  candidateMoviesPool: [],

  /**
   * Entry Point
   */
  async init() {
    UIManager.initElements();
    this.bindEvents();
    UIManager.updateWatchlistCounters();

    // Check backend status and TMDB key configuration in .env
    const status = await TMDBApi.checkBackendStatus();
    UIManager.updateApiStatusIndicator(status);

    if (!status.ok) {
      console.warn('[CineMatch] TMDB API key not configured or backend unavailable:', status.message);
      UIManager.renderWatchlist();
      return;
    }

    await this.loadInitialData();
  },

  /**
   * Load initial data from backend proxy
   */
  async loadInitialData() {
    try {
      // 1. Fetch official genre taxonomy
      const genresData = await TMDBApi.getGenres();
      const genres = genresData.genres || genresData || [];
      UIManager.genresList = genres;
      genres.forEach(g => {
        UIManager.genresMap[g.id] = g.name;
      });

      UIManager.renderGenrePreferenceChips(genres);
      UIManager.renderGenreDropdown(genres);

      // 2. Fetch Trending movies for Carousel & Hero spotlight
      const trendingData = await TMDBApi.getTrending(1);
      const trendingMovies = trendingData.results || [];
      if (trendingMovies.length > 0) {
        const featured = trendingMovies.find(m => m.backdrop_path && m.vote_average >= 7.0) || trendingMovies[0];
        UIManager.renderHero(featured);
        UIManager.renderCarousel(UIManager.dom.trendingTrack, trendingMovies);
        this.addCandidatesToPool(trendingMovies);
      }

      UIManager.setupCarouselControls(
        UIManager.dom.trendingTrack,
        UIManager.dom.trendingPrev,
        UIManager.dom.trendingNext
      );

      // 3. Fetch Top Rated / Popular movies
      const popularData = await TMDBApi.getPopular(1);
      const popularMovies = popularData.results || [];
      UIManager.renderCarousel(UIManager.dom.popularTrack, popularMovies);
      this.addCandidatesToPool(popularMovies);

      UIManager.setupCarouselControls(
        UIManager.dom.popularTrack,
        UIManager.dom.popularPrev,
        UIManager.dom.popularNext
      );

      // 4. Initial Discover catalog fetch
      await this.fetchDiscoverCatalog(1, false);

      // 5. Initial Personalized Recommendations
      this.updateRecommendations();

      // 6. Render Watchlist
      UIManager.renderWatchlist();

    } catch (err) {
      console.error('[CineMatch] Initialization error:', err);
      if (err.code === 'KEY_MISSING' || err.code === 'INVALID_KEY') {
        UIManager.showToast('Please configure a valid TMDB_API_KEY in .env and restart server.', 'warning');
        UIManager.openApiModal();
      } else if (err.code === 'NETWORK_ERROR') {
        UIManager.showToast('Backend connection error. Make sure "npm start" is running.', 'warning');
      } else {
        UIManager.showToast(err.message || 'Error connecting to movie service.', 'warning');
      }
    }
  },

  /**
   * Add movies to candidate pool for content-based scoring
   */
  addCandidatesToPool(movies) {
    if (!movies || !Array.isArray(movies)) return;
    const existingIds = new Set(this.candidateMoviesPool.map(m => m.id));
    movies.forEach(m => {
      if (m && m.id && !existingIds.has(m.id)) {
        this.candidateMoviesPool.push(m);
        existingIds.add(m.id);
      }
    });
  },

  /**
   * Fetch discover catalog or search results via proxy
   */
  async fetchDiscoverCatalog(page = 1, append = false) {
    const loadBtn = UIManager.dom.loadMoreBtn;
    const btnSpinner = loadBtn.querySelector('.btn-spinner');
    const btnText = loadBtn.querySelector('.btn-text');

    if (append) {
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Loading...';
      loadBtn.disabled = true;
    }

    try {
      let data = null;

      if (UIManager.isSearching && UIManager.activeSearchQuery) {
        data = await TMDBApi.searchMovies(UIManager.activeSearchQuery, page);
        if (!data) return;

        UIManager.dom.discoverResultsCount.textContent = `Found ${(data.total_results || 0).toLocaleString()} results for "${UIManager.activeSearchQuery}"`;
      } else {
        data = await TMDBApi.discoverMovies({
          genreId: UIManager.selectedDiscoverGenre,
          sortBy: UIManager.selectedSort,
          page
        });

        const genreLabel = UIManager.selectedDiscoverGenre && UIManager.genresMap[UIManager.selectedDiscoverGenre]
          ? ` in ${UIManager.genresMap[UIManager.selectedDiscoverGenre]}`
          : '';
        UIManager.dom.discoverResultsCount.textContent = `Showing ${(data.total_results || 0).toLocaleString()} movies${genreLabel}`;
      }

      UIManager.currentDiscoverPage = data.page || page;
      UIManager.totalDiscoverPages = data.total_pages || 1;

      const movies = data.results || [];
      this.addCandidatesToPool(movies);
      UIManager.renderDiscoverGrid(movies, append);

    } catch (err) {
      console.error('[Discover] Error fetching catalog:', err);
      UIManager.showToast(err.message || 'Error loading movies.', 'warning');
    } finally {
      if (append) {
        btnSpinner.classList.add('hidden');
        btnText.textContent = 'Load More Movies';
        loadBtn.disabled = false;
      }
    }
  },

  /**
   * Recalculate Personalized Recommendations
   */
  updateRecommendations() {
    UIManager.renderRecommendations(this.candidateMoviesPool);
  },

  /**
   * Global Event Bindings
   */
  bindEvents() {
    // 1. Sticky Navigation on Scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        UIManager.dom.navbar.classList.add('scrolled');
      } else {
        UIManager.dom.navbar.classList.remove('scrolled');
      }
    }, { passive: true });

    // 2. Mobile Navigation Toggle
    UIManager.dom.mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = UIManager.dom.mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      UIManager.dom.mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
      UIManager.dom.mobileNavDrawer.classList.toggle('open');
    });

    // Close mobile drawer on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        UIManager.dom.mobileNavDrawer.classList.remove('open');
        UIManager.dom.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // 3. API Settings Modal Triggers
    UIManager.dom.mobileApiBtn.addEventListener('click', () => {
      UIManager.dom.mobileNavDrawer.classList.remove('open');
      UIManager.openApiModal();
    });
    UIManager.dom.bannerSetupBtn.addEventListener('click', () => UIManager.openApiModal());
    UIManager.dom.apiModalCloseBtn.addEventListener('click', () => UIManager.closeApiModal());

    // Check Backend Connection Button
    UIManager.dom.checkBackendStatusBtn.addEventListener('click', async () => {
      const status = await UIManager.refreshBackendStatus();
      if (status.ok) {
        UIManager.showToast('Backend verified with TMDB!', 'success');
        this.loadInitialData();
      }
    });

    // 4. Algorithm Info Modal
    UIManager.dom.algoInfoBtn.addEventListener('click', () => UIManager.openAlgoModal());
    UIManager.dom.algoModalCloseBtn.addEventListener('click', () => UIManager.closeAlgoModal());

    // 5. Global Search Input with Debounce & Race-condition prevention
    UIManager.dom.globalSearchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();

      if (val) {
        UIManager.dom.searchClearBtn.classList.remove('hidden');
      } else {
        UIManager.dom.searchClearBtn.classList.add('hidden');
      }

      clearTimeout(UIManager.searchDebounceTimer);
      UIManager.searchDebounceTimer = setTimeout(() => {
        if (val) {
          UIManager.isSearching = true;
          UIManager.activeSearchQuery = val;
          UIManager.dom.activeFiltersRow.classList.remove('hidden');
          UIManager.dom.activeFilterTag.textContent = `Search: "${val}"`;
          UIManager.currentDiscoverPage = 1;
          this.fetchDiscoverCatalog(1, false);

          const disc = document.getElementById('discover-section');
          if (disc && window.scrollY < disc.offsetTop - 100) {
            disc.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          UIManager.handleResetFilters();
        }
      }, CONFIG.SEARCH_DEBOUNCE_MS);
    });

    // Search Clear Button
    UIManager.dom.searchClearBtn.addEventListener('click', () => {
      UIManager.handleResetFilters();
      UIManager.dom.globalSearchInput.focus();
    });

    // 6. Discover Filters & Sort
    UIManager.dom.genreSelect.addEventListener('change', (e) => {
      UIManager.selectedDiscoverGenre = e.target.value;
      UIManager.currentDiscoverPage = 1;

      if (UIManager.selectedDiscoverGenre) {
        const genreName = UIManager.genresMap[UIManager.selectedDiscoverGenre] || 'Selected';
        UIManager.dom.activeFiltersRow.classList.remove('hidden');
        UIManager.dom.activeFilterTag.textContent = `Genre: ${genreName}`;
      } else if (!UIManager.isSearching) {
        UIManager.dom.activeFiltersRow.classList.add('hidden');
      }

      this.fetchDiscoverCatalog(1, false);
    });

    UIManager.dom.sortSelect.addEventListener('change', (e) => {
      UIManager.selectedSort = e.target.value;
      UIManager.currentDiscoverPage = 1;
      this.fetchDiscoverCatalog(1, false);
    });

    UIManager.dom.resetFiltersBtn.addEventListener('click', () => {
      UIManager.handleResetFilters();
    });

    // 7. Load More Pagination
    UIManager.dom.loadMoreBtn.addEventListener('click', () => {
      if (UIManager.currentDiscoverPage < UIManager.totalDiscoverPages) {
        this.fetchDiscoverCatalog(UIManager.currentDiscoverPage + 1, true);
      }
    });

    // 8. Favorite Genre Preference Chips in "For You" Section
    UIManager.dom.recsGenreChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.genre-chip');
      if (!chip) return;

      const genreId = Number(chip.dataset.genreId);
      const updated = StorageManager.toggleFavoriteGenre(genreId);
      const isSelected = updated.includes(genreId);

      chip.classList.toggle('selected', isSelected);
      chip.setAttribute('aria-pressed', isSelected);

      UIManager.showToast(
        isSelected ? `Added ${chip.textContent.trim()} to preferences` : `Removed ${chip.textContent.trim()}`,
        'info'
      );

      this.updateRecommendations();
    });

    // Refresh Recommendations Button
    UIManager.dom.refreshRecsBtn.addEventListener('click', () => {
      UIManager.dom.refreshRecsBtn.querySelector('.refresh-icon').style.transform = 'rotate(360deg)';
      setTimeout(() => {
        UIManager.dom.refreshRecsBtn.querySelector('.refresh-icon').style.transform = '';
      }, 600);

      this.updateRecommendations();
      UIManager.showToast('Updated personalized recommendations!', 'success');
    });

    // 9. Hero Section Action Buttons
    UIManager.dom.heroMoreInfoBtn.addEventListener('click', () => {
      if (UIManager.featuredHeroMovie && UIManager.featuredHeroMovie.id) {
        UIManager.openMovieModal(UIManager.featuredHeroMovie.id);
      }
    });

    UIManager.dom.heroWatchlistBtn.addEventListener('click', () => {
      if (!UIManager.featuredHeroMovie) return;
      const movie = UIManager.featuredHeroMovie;
      const inWatchlist = StorageManager.isInWatchlist(movie.id);

      if (inWatchlist) {
        StorageManager.removeFromWatchlist(movie.id);
        UIManager.showToast(`Removed "${movie.title}" from watchlist.`, 'info');
      } else {
        StorageManager.addToWatchlist(movie);
        UIManager.showToast(`Added "${movie.title}" to watchlist!`, 'success');
      }

      UIManager.renderHero(movie);
      UIManager.updateWatchlistCounters();
      UIManager.renderWatchlist();
      this.updateCardWatchlistButtons(movie.id);
    });

    // 10. Clear Watchlist Button
    UIManager.dom.clearWatchlistBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your entire watchlist?')) {
        StorageManager.clearWatchlist();
        UIManager.updateWatchlistCounters();
        UIManager.renderWatchlist();
        document.querySelectorAll('.card-watchlist-btn.active').forEach(btn => {
          btn.classList.remove('active');
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
        });
        UIManager.showToast('Watchlist cleared.', 'info');
      }
    });

    // 11. Modal Close Button & Backdrop Click
    UIManager.dom.modalCloseBtn.addEventListener('click', () => UIManager.closeMovieModal());

    [UIManager.dom.movieModal, UIManager.dom.apiModal, UIManager.dom.algoModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal === UIManager.dom.movieModal) UIManager.closeMovieModal();
          else if (modal === UIManager.dom.apiModal) UIManager.closeApiModal();
          else if (modal === UIManager.dom.algoModal) UIManager.closeAlgoModal();
        }
      });
    });

    // Keyboard ESC listener for accessible modal dismissal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!UIManager.dom.movieModal.classList.contains('hidden')) UIManager.closeMovieModal();
        if (!UIManager.dom.apiModal.classList.contains('hidden')) UIManager.closeApiModal();
        if (!UIManager.dom.algoModal.classList.contains('hidden')) UIManager.closeAlgoModal();
      }
      if (e.key === '/' && document.activeElement !== UIManager.dom.globalSearchInput) {
        e.preventDefault();
        UIManager.dom.globalSearchInput.focus();
      }
    });

    // 12. Modal Interactive Action Handlers (Watchlist, Like, Dislike)
    UIManager.dom.modalWatchlistBtn.addEventListener('click', () => {
      if (!UIManager.activeMovieInModal) return;
      const movie = UIManager.activeMovieInModal;
      const inWatchlist = StorageManager.isInWatchlist(movie.id);

      if (inWatchlist) {
        StorageManager.removeFromWatchlist(movie.id);
        UIManager.showToast(`Removed "${movie.title}" from watchlist.`, 'info');
      } else {
        StorageManager.addToWatchlist(movie);
        UIManager.showToast(`Added "${movie.title}" to watchlist!`, 'success');
      }

      UIManager.updateModalActionButtons(movie.id);
      UIManager.updateWatchlistCounters();
      UIManager.renderWatchlist();
      this.updateCardWatchlistButtons(movie.id);
    });

    UIManager.dom.modalLikeBtn.addEventListener('click', () => {
      if (!UIManager.activeMovieInModal) return;
      const movie = UIManager.activeMovieInModal;
      const isLiked = StorageManager.isLiked(movie.id);

      if (isLiked) {
        StorageManager.removeLike(movie.id);
        UIManager.showToast(`Removed like for "${movie.title}".`, 'info');
      } else {
        StorageManager.addLike(movie);
        UIManager.showToast(`Liked "${movie.title}"! Algorithm updated.`, 'success');
      }

      UIManager.updateModalActionButtons(movie.id);
      this.updateRecommendations();
    });

    UIManager.dom.modalDislikeBtn.addEventListener('click', () => {
      if (!UIManager.activeMovieInModal) return;
      const movie = UIManager.activeMovieInModal;
      const isDisliked = StorageManager.isDisliked(movie.id);

      if (isDisliked) {
        StorageManager.removeDislike(movie.id);
        UIManager.showToast(`Removed dislike for "${movie.title}".`, 'info');
      } else {
        StorageManager.addDislike(movie.id);
        UIManager.showToast(`Excluded "${movie.title}" from recommendations.`, 'info');
      }

      UIManager.updateModalActionButtons(movie.id);
      this.updateRecommendations();
    });

    // 13. Event Delegation for Movie Cards (Clicks on card, watchlist, like, modal open)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.movie-card');
      if (!card) return;

      const movieId = Number(card.dataset.movieId);
      if (!movieId) return;

      const actionBtn = e.target.closest('.card-action-btn');
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;

        if (action === 'toggle-watchlist') {
          const inWatchlist = StorageManager.isInWatchlist(movieId);
          if (inWatchlist) {
            StorageManager.removeFromWatchlist(movieId);
            UIManager.showToast('Removed from Watchlist.', 'info');
          } else {
            const movie = this.candidateMoviesPool.find(m => m.id === movieId) || {
              id: movieId,
              title: card.querySelector('.card-title')?.textContent || 'Movie',
              poster_path: card.querySelector('.card-poster')?.getAttribute('src') || null,
              vote_average: parseFloat(card.querySelector('.card-rating-badge span')?.textContent) || 0
            };
            StorageManager.addToWatchlist(movie);
            UIManager.showToast('Added to Watchlist!', 'success');
          }
          UIManager.updateWatchlistCounters();
          UIManager.renderWatchlist();
          this.updateCardWatchlistButtons(movieId);
        } else if (action === 'toggle-like') {
          const isLiked = StorageManager.isLiked(movieId);
          const movie = this.candidateMoviesPool.find(m => m.id === movieId) || { id: movieId, title: 'Movie' };

          if (isLiked) {
            StorageManager.removeLike(movieId);
            actionBtn.classList.remove('active');
            UIManager.showToast('Removed like.', 'info');
          } else {
            StorageManager.addLike(movie);
            actionBtn.classList.add('active');
            UIManager.showToast('Liked movie! Suggestions refreshed.', 'success');
          }
          this.updateRecommendations();
        } else if (action === 'open-modal') {
          UIManager.openMovieModal(movieId);
        }
        return;
      }

      UIManager.openMovieModal(movieId);
    });

    // Accessibility: Enter or Space on movie card opens modal
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('movie-card')) {
        e.preventDefault();
        const movieId = Number(e.target.dataset.movieId);
        if (movieId) UIManager.openMovieModal(movieId);
      }
    });
  },

  /**
   * Helper to sync watchlist buttons across all visible cards for a specific movie ID
   */
  updateCardWatchlistButtons(movieId) {
    const inWatchlist = StorageManager.isInWatchlist(movieId);
    document.querySelectorAll(`.movie-card[data-movie-id="${movieId}"] .card-watchlist-btn`).forEach(btn => {
      if (inWatchlist) {
        btn.classList.add('active');
        btn.title = 'Remove from Watchlist';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      } else {
        btn.classList.remove('active');
        btn.title = 'Add to Watchlist';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      }
    });
  }
};

// Initialize App when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
