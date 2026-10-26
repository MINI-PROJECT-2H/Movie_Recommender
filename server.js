/**
 * CineMatch - Node.js Express Backend & TMDB API Proxy Server
 * 
 * Secure Architecture:
 * - Reads TMDB_API_KEY securely from .env via dotenv
 * - Exposes safe, validated /api endpoints
 * - Never transmits or leaks TMDB_API_KEY to the browser or network logs
 * - Serves the frontend static files (HTML, CSS, Vanilla JS)
 */

'use strict';

const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware
app.use(express.json());

// Enable CORS for Vercel preview/production deployments
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// In-memory cache for static/semi-static TMDB responses
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Safely retrieve TMDB API key from environment variables.
 * Checks primary TMDB_API_KEY as well as common fallbacks.
 * Strips accidental surrounding quotes and whitespace.
 */
function getApiKey() {
  const raw = (
    process.env.TMDB_API_KEY ||
    process.env.TMDB_KEY ||
    process.env.VITE_TMDB_API_KEY ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    ''
  ).trim();
  return raw.replace(/^["']|["']$/g, '').trim();
}

/**
 * Validate that TMDB_API_KEY is configured and not the default placeholder
 */
function isKeyConfigured() {
  const key = getApiKey();
  return Boolean(
    key &&
    key !== 'your_actual_key_goes_here' &&
    key !== 'your_api_key_here' &&
    key !== 'your_key_here'
  );
}

/**
 * Core helper to make authenticated requests to upstream TMDB API
 * Keeps the API key completely hidden on the server.
 * Supports both standard TMDB v3 API Key (32 chars) and v4 Read Access Token (Bearer JWT).
 */
async function callTmdb(endpoint, queryParams = {}, useCache = true) {
  if (!isKeyConfigured()) {
    const err = new Error('TMDB_API_KEY is not configured in Vercel or .env environment variables.');
    err.status = 503;
    err.code = 'KEY_MISSING';
    throw err;
  }

  const apiKey = getApiKey();
  const cacheKey = `${endpoint}_${JSON.stringify(queryParams)}`;
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const headers = {
    'Accept': 'application/json'
  };

  const params = new URLSearchParams({
    language: 'en-US',
    ...queryParams
  });

  // If TMDB Read Access Token (JWT Bearer token), pass via Authorization header
  if (apiKey.startsWith('eyJ') || apiKey.length > 50) {
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  } else {
    params.set('api_key', apiKey);
  }

  const url = `${TMDB_BASE_URL}${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (_) {}

      const err = new Error(errorData.status_message || `TMDB upstream error HTTP ${response.status}`);
      err.status = response.status;
      err.code = response.status === 401 ? 'INVALID_KEY' : response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM_ERROR';
      throw err;
    }

    const data = await response.json();
    if (useCache) {
      setCached(cacheKey, data);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error('Network error connecting to upstream TMDB service.');
      netErr.status = 502;
      netErr.code = 'NETWORK_ERROR';
      throw netErr;
    }
    throw err;
  }
}

/* ==========================================================================
   REST API Proxy Routes
   ========================================================================== */

/**
 * GET /api
 * Root proxy status
 */
app.get('/api', (req, res) => {
  res.json({
    name: 'CineMatch TMDB Proxy API',
    status: 'online',
    keyConfigured: isKeyConfigured()
  });
});

/**
 * GET /api/status
 * Returns current backend API status and configuration check without leaking secrets
 */
app.get('/api/status', async (req, res) => {
  const configured = isKeyConfigured();
  if (!configured) {
    return res.json({
      ok: false,
      keyConfigured: false,
      message: 'TMDB_API_KEY is not configured in Vercel or .env environment variables.'
    });
  }

  // Ping upstream TMDB to verify credential validity
  try {
    await callTmdb('/movie/popular', { page: '1' }, false);
    return res.json({
      ok: true,
      keyConfigured: true,
      message: 'TMDB API Key configured and connected successfully.'
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      ok: false,
      keyConfigured: true,
      message: err.message,
      code: err.code || 'VALIDATION_FAILED'
    });
  }
});

/**
 * GET /api/genres
 * Returns movie genre taxonomy
 */
app.get('/api/genres', async (req, res, next) => {
  try {
    const data = await callTmdb('/genre/movie/list', {}, true);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trending
 * Returns weekly trending movies
 */
app.get('/api/trending', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const data = await callTmdb('/trending/movie/week', { page: String(page) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/popular
 * Returns popular movies
 */
app.get('/api/popular', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const data = await callTmdb('/movie/popular', { page: String(page) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/top_rated
 * Returns top rated movies
 */
app.get('/api/top_rated', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const data = await callTmdb('/movie/top_rated', { page: String(page) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/discover
 * Discover movies with filtering & sorting
 */
app.get('/api/discover', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const allowedSorts = [
      'popularity.desc',
      'vote_average.desc',
      'primary_release_date.desc',
      'revenue.desc'
    ];
    const sortBy = allowedSorts.includes(req.query.sort_by) ? req.query.sort_by : 'popularity.desc';
    const params = {
      sort_by: sortBy,
      page: String(page),
      include_adult: 'false',
      'vote_count.gte': sortBy === 'vote_average.desc' ? '100' : '10'
    };

    if (req.query.with_genres) {
      // Validate genre id list (e.g. "28,878")
      const cleanedGenres = req.query.with_genres
        .split(',')
        .map(g => parseInt(g.trim(), 10))
        .filter(g => !isNaN(g))
        .join(',');
      if (cleanedGenres) {
        params.with_genres = cleanedGenres;
      }
    }

    const data = await callTmdb('/discover/movie', params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search
 * Search movies by title
 */
app.get('/api/search', async (req, res, next) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Search query parameter "query" is required.' });
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const data = await callTmdb('/search/movie', {
      query,
      page: String(page),
      include_adult: 'false'
    }, false);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movie/:id
 * Full movie details with appended credits, videos, and recommendations
 */
app.get('/api/movie/:id', async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({ error: 'Valid numeric movie ID is required.' });
    }

    const append = req.query.append_to_response || 'credits,videos,recommendations,similar';
    const data = await callTmdb(`/movie/${movieId}`, { append_to_response: append });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movie/:id/credits
 */
app.get('/api/movie/:id/credits', async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({ error: 'Valid numeric movie ID is required.' });
    }
    const data = await callTmdb(`/movie/${movieId}/credits`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movie/:id/videos
 */
app.get('/api/movie/:id/videos', async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({ error: 'Valid numeric movie ID is required.' });
    }
    const data = await callTmdb(`/movie/${movieId}/videos`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/movie/:id/recommendations
 */
app.get('/api/movie/:id/recommendations', async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({ error: 'Valid numeric movie ID is required.' });
    }
    const data = await callTmdb(`/movie/${movieId}/recommendations`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   Static Frontend Serving
   ========================================================================== */
app.use(express.static(path.join(__dirname)));

// Global API error handler
app.use('/api', (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
    status
  });
});

// Start Server (only when executed directly locally, not when imported as Vercel serverless function)
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🎬 CineMatch Server running on http://localhost:${PORT}`);
    console.log(`🔒 TMDB API Proxy active - API key secured`);
    console.log(`🔑 Key status: ${isKeyConfigured() ? 'Configured' : 'Missing / Placeholder (.env setup required)'}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
