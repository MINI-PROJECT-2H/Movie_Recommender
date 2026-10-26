# CineMatch — Intelligent Movie Discovery & Recommendation Platform

> **A Netflix-inspired, content-based movie recommendation system built with semantic HTML5, CSS3, Vanilla JavaScript, and a secure Node.js Express TMDB API proxy backend.**

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TMDB API](https://img.shields.io/badge/TMDB_API-01B4E4?style=flat&logo=themoviedatabase&logoColor=white)](https://developer.themoviedb.org)

---

## 1. Project Overview & Architectural Decision

### 1.1 Architecture & Security Decision
Client-side browser JavaScript cannot read a `.env` file directly because web browsers execute inside a sandboxed runtime with no direct filesystem access or access to `process.env`. Attempting to read `.env` via `fetch('/.env')` is both a severe security vulnerability (exposing secret keys publicly) and fundamentally incorrect engineering. Furthermore, in frontend build tools like Vite, prefixing variables with `VITE_` embeds the credential into the compiled client bundle, exposing it to anyone viewing browser developer tools.

To properly protect the TMDB API credential, **CineMatch employs a minimal Node.js/Express backend proxy**:
1. The backend server loads `TMDB_API_KEY` from `.env` using `dotenv`.
2. The backend mediates all communication with TMDB, attaching the secret key to upstream requests server-side.
3. The frontend remains plain **HTML5, CSS3, and Vanilla JavaScript**, calling safe local `/api` proxy endpoints.
4. **The secret TMDB API key is never sent to the browser, never logged, and never included in API responses.**

---

## 2. Key Features

- **Protected API Credentials**: `TMDB_API_KEY` is loaded exclusively on the server from `.env`. Zero secrets in tracked files or client network traffic.
- **Cinematic Netflix-Inspired Interface**: Deep charcoal & obsidian backdrop (`#141414`), Netflix red accents (`#E50914`), custom scrollbars, frosted glass navigation, and smooth hover animations.
- **Dynamic Spotlight Hero**: Real-time spotlight banner showcasing trending films with high-resolution backdrops, metadata tags, and seamless modal triggers.
- **Interactive Horizontal Carousels**: Smooth horizontal scrolling tracks with left/right slider controls, boundary-aware navigation arrows, and responsive snap points.
- **Transparent Content-Based Recommendation Engine**:
  - Calculates weighted feature scores based on explicit genre preferences and liked movie associations.
  - Dynamically calculates a **Netflix-style Match Percentage Badge** (e.g. *96% Match*).
  - Provides a natural-language explanation for every suggestion (e.g. *"Matches your Sci-Fi & Action preference"*).
  - Automatically suppresses disliked films and titles the user has already liked.
- **Instant Interactive Genre Chips**: Toggle preferred genres directly in the UI to guide the scoring engine in real-time.
- **Persistent Watchlist**:
  - Add or remove movies with heart buttons anywhere in the interface.
  - Real-time animated counter in the navigation bar.
  - Persisted in browser `localStorage` across page reloads.
- **Comprehensive Movie Details Modal**:
  - High-resolution backdrop & synopsis.
  - Embedded YouTube official trailers via privacy-enhanced player.
  - Detailed runtime (`2h 15m`), TMDB rating, vote count, and release year.
  - Cast row with actor profile photos and character names.
  - "More Like This" similar movies row with one-click transitions.
- **Catalog Discovery & Search Engine**:
  - Live title search with 350ms input debouncing and asynchronous race-condition prevention.
  - Dynamic genre dropdown populated from TMDB's live taxonomy.
  - Sorting by Popularity, Highest Rated, Newest Release, and Box Office.
  - "Load More" pagination with loading spinner states.
- **Resilient Error Boundaries**:
  - Handles missing `.env` key state gracefully with a friendly setup notice banner.
  - Upstream 401 (Invalid Key) and 429 (Rate Limit) error handling with sanitized JSON responses.
  - Zero console errors; untrusted API strings sanitized to prevent XSS.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend / Proxy** | Node.js + Express + `dotenv` | Loads `TMDB_API_KEY` from `.env`, serves protected `/api` routes, and serves the static frontend without exposing secrets. |
| **Markup** | HTML5 Semantic Elements | High accessibility, clean document hierarchy (`<header>`, `<main>`, `<section>`, `<dialog>`), SEO meta tags. |
| **Styling** | Vanilla CSS3 (Custom Properties) | Ultra-fast rendering, zero build-step overhead, responsive CSS Grid and Flexbox, modern keyframe animations. |
| **Logic** | Vanilla JavaScript (ES6+) | Object-oriented modular architecture without frameworks, async/await fetch pipelines, in-memory caching. |
| **Data Source** | TMDB REST API (v3) | Comprehensive metadata covering global trending, popular, search, credits, videos, and recommendations. |
| **Persistence** | Browser `localStorage` | Fast, client-side persistence for Watchlist, Likes, Dislikes, and Favorite Genres without requiring a database. |

---

## 4. System Architecture

```
+-------------------------------------------------------------------------+
|                              Browser UI                                 |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |    Hero Banner     |  | Trending & Popular |  | Personalized Recs |  |
|  +--------------------+  +--------------------+  +-------------------+  |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |  Discover Catalog  |  |    My Watchlist    |  | Movie Detail View |  |
|  +--------------------+  +--------------------+  +-------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     v HTTP Requests (NO API KEY in requests)
+-------------------------------------------------------------------------+
|                 Node.js / Express Server (server.js)                    |
|                                                                         |
|  - Loads TMDB_API_KEY from .env via dotenv                              |
|  - Validates and sanitizes parameters                                   |
|  - Exposes safe /api proxy routes                                       |
|  - In-memory cache for genre list & details                             |
|  - Serves static assets (index.html, style.css, script.js)              |
+------------------------------------+------------------------------------+
                                     |
                                     v HTTPS (Secret TMDB_API_KEY attached)
+-------------------------------------------------------------------------+
|                  The Movie Database (TMDB) REST API                     |
|  /genre/movie/list  |  /trending/movie/week  |  /movie/popular          |
|  /discover/movie    |  /search/movie         |  /movie/{id}             |
+-------------------------------------------------------------------------+
```

---

## 5. Content-Based Recommendation Algorithm

### 5.1 Formulation
Unlike black-box collaborative filtering, CineMatch implements a **deterministic content-based filtering model** based on explicit user profile features.

Given candidate movie $M$ with genre set $G_M$, TMDB rating $R_M \in [0, 10]$, and popularity $P_M \ge 0$:

$$\text{Score}(M) = \sum_{g \in G_M} S_{\text{explicit}}(g) + \sum_{g \in G_M} S_{\text{liked}}(g) + S_{\text{rating}}(M) + S_{\text{popularity}}(M)$$

Where:
1. **Explicit Genre Score**:
   $$S_{\text{explicit}}(g) = \begin{cases} 4.0 & \text{if } g \in \text{FavoriteGenres} \\ 0 & \text{otherwise} \end{cases}$$
2. **Liked Movies History Score**:
   $$S_{\text{liked}}(g) = 3.0 \times \frac{\text{Frequency}(g, \text{LikedMovies})}{\max(1, |\text{LikedMovies}|)}$$
3. **Rating Quality Factor**:
   $$S_{\text{rating}}(M) = \frac{R_M}{10.0} \times 2.0 \quad (\text{yields up to } +2.0 \text{ points})$$
4. **Logarithmic Popularity Bonus**:
   $$S_{\text{popularity}}(M) = \min\left(2.0, \log_{10}(\max(1, P_M)) \times 0.7\right) \quad (\text{yields up to } +2.0 \text{ points})$$

### 5.2 Exclusion Filters
- Movies present in $\text{DislikedMovies}$ are permanently excluded: $\forall M \in \text{DislikedMovies}, M \notin \text{Results}$.
- Movies present in $\text{LikedMovies}$ are excluded from new recommendations so users discover new content.
- Adult titles are stripped: $M.\text{adult} \neq \text{true}$.

### 5.3 Match Percentage Transformation
To provide an intuitive streaming UX, the raw mathematical score is mapped to a normalized match score:
$$\text{Match Percentage} = \min\left(99, 72 + \text{round}(\text{Score}(M) \times 2.2)\right)$$

### 5.4 Worked Numerical Example

**User State:**
- **Explicit Favorite Genres**: Sci-Fi (ID: 878), Action (ID: 28)
- **Liked Movies**: *Inception* (Genres: Action, Sci-Fi, Thriller)
- **Total Liked Count**: 1

**Candidate Evaluation: *Interstellar* (2014)**
- **Genres**: Adventure, Drama, Sci-Fi (ID: 878)
- **TMDB Rating ($R_M$)**: 8.4
- **Popularity ($P_M$)**: 142.5

**Scoring Calculation:**
1. **Explicit Genre Match**:
   - Sci-Fi is in Favorite Genres: **+4.00 pts**
2. **Liked Genre Association**:
   - Sci-Fi appears in 1 of 1 liked movies ($1/1 \times 3.0$): **+3.00 pts**
3. **Rating Quality Factor**:
   - $(8.4 / 10.0) \times 2.0$: **+1.68 pts**
4. **Popularity Factor**:
   - $\min(2.0, \log_{10}(142.5) \times 0.7) = \min(2.0, 2.15 \times 0.7) = \min(2.0, 1.50)$: **+1.50 pts**

$$\mathbf{\text{Total Raw Score}} = 4.00 + 3.00 + 1.68 + 1.50 = \mathbf{10.18 \text{ pts}}$$

$$\mathbf{\text{Match Badge}} = \min(99, 72 + \text{round}(10.18 \times 2.2)) = \min(99, 72 + 22) = \mathbf{94\% \text{ Match}}$$

**Generated Explanation**: *"Matches your Sci-Fi preference"*

---

## 6. Project Structure

```
c:/Users/rv347/MOVIE_RECOMMENDER_NEW/
├── .env              # Local environment variables (IGNORED in Git, contains TMDB_API_KEY)
├── .env.example      # Tracked template with placeholder values
├── .gitignore        # Explicitly ignores .env, .env.*, node_modules, logs
├── package.json      # Node.js project definition & scripts
├── server.js         # Express backend & TMDB proxy (loads .env via dotenv)
├── index.html        # Semantic HTML5 layout, accessible modals, and carousels
├── style.css         # Modern Netflix design system, CSS tokens, responsive grid
├── script.js         # Modular Vanilla JS (Storage, TMDBApi, Recommender, UI, App)
├── config.js         # App config (points to /api proxy, image sizes & weights)
├── test_suite.js     # Automated test suite (DOM, Recommender, Watchlist, Routes, Git)
└── README.md         # Comprehensive project documentation & evaluation guide
```

---

## 7. Setup & Execution Instructions

### 7.1 Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; developed on Node v24).

### 7.2 Install Dependencies
In the project directory, install `express` and `dotenv`:
```bash
npm install
```

### 7.3 Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and set your TMDB API key:
```env
TMDB_API_KEY=your_actual_key_goes_here
PORT=3000
```
*(Get a free developer key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)).*

### 7.4 Start the Application
```bash
npm start
```
Then visit: **`http://localhost:3000`**

For development with automatic reload on changes:
```bash
npm run dev
```

### 7.5 Run Automated Test Suite
```bash
npm test
```

---

## 8. Backend API Proxy Endpoints

The Express server exposes the following safe `/api` endpoints:

| Endpoint | Target TMDB API Endpoint | Description |
| :--- | :--- | :--- |
| `GET /api/status` | `/movie/popular` (ping test) | Returns proxy connection status & whether key is set in `.env`. |
| `GET /api/genres` | `/genre/movie/list` | Returns official genre list. |
| `GET /api/trending` | `/trending/movie/week` | Returns weekly trending titles for Hero & Carousel. |
| `GET /api/popular` | `/movie/popular` | Returns popular movie list. |
| `GET /api/top_rated` | `/movie/top_rated` | Returns top-rated movie titles. |
| `GET /api/discover` | `/discover/movie` | Multi-criteria discover with genre and sorting filters. |
| `GET /api/search` | `/search/movie` | Live search by movie title (query validated). |
| `GET /api/movie/:id` | `/movie/{id}` | Full movie details with appended credits, videos, and recommendations. |
| `GET /api/movie/:id/credits` | `/movie/{id}/credits` | Cast member profiles and headshots. |
| `GET /api/movie/:id/videos` | `/movie/{id}/videos` | Official YouTube trailers and teasers. |
| `GET /api/movie/:id/recommendations` | `/movie/{id}/recommendations` | Similar and recommended titles. |

---

## 9. Verification & Testing Summary

| Test Area | Scenario Tested | Result |
| :--- | :--- | :--- |
| **Environment Configuration** | `.env` and `.env.example` creation | Created with `TMDB_API_KEY=your_actual_key_goes_here` and `PORT=3000`. |
| **Git Exclusion** | `.gitignore` rule verification | `.env` and `.env.*` are ignored; `.env.example` is explicitly preserved. |
| **Secret Leak Audit** | Search across all tracked files | **Passed.** 0 hardcoded keys found in HTML, CSS, JavaScript, or config files. |
| **Status Endpoint** | `GET /api/status` with placeholder key | Returns `503` / `{ ok: false, keyConfigured: false }` with clear setup message. |
| **Error Boundary** | `GET /api/trending` without configured key | Returns HTTP 503 `KEY_MISSING` and sanitized JSON; does not crash server. |
| **Static File Serving** | `GET /` on `http://localhost:3000` | Returns `index.html` with status 200 OK. |
| **DOM ID Integrity** | Integration test | All 72 static DOM IDs referenced in `script.js` exist in `index.html`. |
| **Recommendation Engine** | Scoring math & exclusions | Calculates exact weighted score (10.18 pts) and excludes disliked movies. |
| **Watchlist CRUD** | LocalStorage persistence | Add, remove, and duplicate detection verified. |

### Note on Live Upstream Tests
Because no valid personal TMDB API key was committed to the workspace (protecting user privacy), live upstream fetching tests against TMDB return the expected `KEY_MISSING` response. Once you paste your authentic 32-character key into `.env` and restart, all upstream endpoints immediately return live TMDB movie data.

---

## 10. TMDB Attribution & Disclaimer

This product uses the TMDB API but is not endorsed or certified by TMDB. All movie posters, backdrops, cast imagery, and synopsis data are copyright of their respective owners and accessed in compliance with TMDB terms of use.

---

**Developed for academic demonstration and portfolio excellence.**
