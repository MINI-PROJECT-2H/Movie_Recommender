const fs = require('fs');
const assert = require('assert');

console.log('--- 1. Validating DOM ID Integrity ---');
const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

const idRegex = /getElementById\('([^']+)'\)/g;
let match;
const ids = new Set();
while ((match = idRegex.exec(script)) !== null) {
  ids.add(match[1]);
}

console.log(`Found ${ids.size} unique DOM ID references in script.js.`);
const dynamicIds = new Set(['empty-reset-btn']);
let missingIds = [];
for (const id of ids) {
  if (!dynamicIds.has(id) && !html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  console.error('Missing IDs in index.html:', missingIds);
  process.exit(1);
} else {
  console.log(`✓ All ${ids.size - dynamicIds.size} static DOM IDs referenced in script.js exist in index.html!`);
}

console.log('\n--- 2. Validating Recommendation Engine Logic ---');
// Mock localStorage
const store = {};
const mockLocalStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global.localStorage = mockLocalStorage;

// Load config
const configCode = fs.readFileSync('config.js', 'utf8');
const vm = require('vm');
const context = {
  console,
  setTimeout,
  clearTimeout,
  URLSearchParams,
  Math,
  Set,
  Map,
  Array,
  Object,
  Number,
  String,
  Boolean,
  JSON,
  Date,
  localStorage: mockLocalStorage,
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  window: {
    addEventListener: () => {}
  }
};
vm.createContext(context);
vm.runInContext(configCode + '\nthis.CONFIG = CONFIG;', context);

// Test weights definition
assert(context.CONFIG.RECOMMENDER_WEIGHTS.EXPLICIT_GENRE_MATCH === 4.0, 'Explicit genre match should be 4.0');
assert(context.CONFIG.RECOMMENDER_WEIGHTS.LIKED_GENRE_MATCH === 3.0, 'Liked genre match should be 3.0');

// Load script in mock environment
vm.runInContext(script + '\nthis.StorageManager = StorageManager; this.RecommendationEngine = RecommendationEngine;', context);
const { StorageManager, RecommendationEngine } = context;

// Set up user preferences: Sci-Fi (878), Action (28)
StorageManager.toggleFavoriteGenre(878);
StorageManager.toggleFavoriteGenre(28);

assert(StorageManager.getFavoriteGenres().includes(878), 'Genre 878 should be in favorites');
assert(StorageManager.getFavoriteGenres().includes(28), 'Genre 28 should be in favorites');

// Add liked movie: Inception (Action: 28, Sci-Fi: 878)
StorageManager.addLike({
  id: 27205,
  title: 'Inception',
  genre_ids: [28, 878]
});
assert(StorageManager.isLiked(27205), 'Inception should be liked');

// Candidates to score
const candidates = [
  {
    id: 157336,
    title: 'Interstellar',
    genre_ids: [12, 18, 878],
    vote_average: 8.4,
    popularity: 140
  },
  {
    id: 999999,
    title: 'Romantic Comedy',
    genre_ids: [10749, 35],
    vote_average: 6.5,
    popularity: 40
  },
  {
    id: 888888,
    title: 'Disliked Movie',
    genre_ids: [878],
    vote_average: 9.0,
    popularity: 200
  }
];

// Dislike movie 888888
StorageManager.addDislike(888888);
assert(StorageManager.isDisliked(888888), 'Movie 888888 should be disliked');

const genresMap = { 878: 'Sci-Fi', 28: 'Action', 12: 'Adventure', 18: 'Drama' };
const recommendations = RecommendationEngine.generateRecommendations(candidates, genresMap);

console.log('Generated recommendations count:', recommendations.length);
assert(recommendations.length === 2, 'Should recommend 2 movies (excluding disliked)');
assert(recommendations[0].id === 157336, 'Interstellar should be top recommendation');
assert(recommendations[0].matchPercentage >= 90, 'Interstellar match percentage should be >= 90%');
console.log(`Top recommendation: ${recommendations[0].title} with score: ${recommendations[0].recommenderScore.toFixed(2)} (${recommendations[0].matchPercentage}% Match)`);
console.log(`Reason: "${recommendations[0].recommendationReason}"`);

// Test Watchlist
console.log('\n--- 3. Validating Watchlist Logic ---');
assert(StorageManager.getWatchlist().length === 0, 'Watchlist should start empty');
StorageManager.addToWatchlist(candidates[0]);
assert(StorageManager.isInWatchlist(157336), 'Interstellar should be in watchlist');
assert(StorageManager.getWatchlist().length === 1, 'Watchlist count should be 1');
StorageManager.removeFromWatchlist(157336);
assert(!StorageManager.isInWatchlist(157336), 'Interstellar should be removed');
assert(StorageManager.getWatchlist().length === 0, 'Watchlist count should be 0');
console.log('✓ Watchlist add/remove/isInWatchlist functions verified!');

// Test Environment Security & Git Configuration
console.log('\n--- 4. Validating Environment Security & .gitignore ---');
const gitignore = fs.readFileSync('.gitignore', 'utf8');
assert(gitignore.includes('.env'), '.gitignore must ignore .env');
assert(gitignore.includes('!.env.example'), '.gitignore must preserve .env.example');
assert(fs.existsSync('.env'), '.env file must exist');
assert(fs.existsSync('.env.example'), '.env.example file must exist');

const envContent = fs.readFileSync('.env', 'utf8');
assert(envContent.includes('TMDB_API_KEY='), '.env must define TMDB_API_KEY');

const envExampleContent = fs.readFileSync('.env.example', 'utf8');
assert(envExampleContent.includes('TMDB_API_KEY=your_actual_key_goes_here'), '.env.example must have placeholder value');
console.log('✓ Environment files and .gitignore configurations verified!');

// Test Backend Express App Routes
console.log('\n--- 5. Validating Express Backend Routes & Key Protection ---');
const server = require('./server');
const routes = [];
server._router.stack.forEach((middleware) => {
  if (middleware.route) {
    routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  }
});

const requiredRoutes = [
  'GET /api/status',
  'GET /api/genres',
  'GET /api/trending',
  'GET /api/popular',
  'GET /api/top_rated',
  'GET /api/discover',
  'GET /api/search',
  'GET /api/movie/:id',
  'GET /api/movie/:id/credits',
  'GET /api/movie/:id/videos',
  'GET /api/movie/:id/recommendations'
];

requiredRoutes.forEach(r => {
  assert(routes.includes(r), `Route ${r} must be registered on server`);
});
console.log(`✓ All ${requiredRoutes.length} backend API proxy routes registered successfully!`);

console.log('\n========================================');
console.log('ALL VERIFICATION UNIT TESTS PASSED (100%)');
console.log('========================================');
