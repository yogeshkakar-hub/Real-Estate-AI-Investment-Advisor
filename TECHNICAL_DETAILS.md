# PropIQ — Technical Reference Documentation

---

## 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  index.html  ─── Single HTML shell (SPA, no page reloads)          │
│  styles.css  ─── 700+ lines, CSS variables, glassmorphism design    │
│                                                                     │
│  js/api.js       ── Centralized fetch wrapper (JWT auto-inject)     │
│  js/auth.js      ── JWT storage + login/register UI                 │
│  js/app.js       ── SPA router, toast system, app bootstrap         │
│  js/chat.js      ── Chat UI, session sidebar, markdown render       │
│  js/dashboard.js ── City cards, animated bars, filter/sort          │
│  js/compare.js   ── Side-by-side city comparison table              │
│  js/wizard.js    ── 4-step wizard, progress bar, AI report          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API over HTTP (JSON)
                             │ Authorization: Bearer <JWT>
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                        │
│                                                                     │
│  server/index.js           ── App bootstrap, middleware, routes     │
│  server/db.js              ── Knex connection + schema init         │
│                                                                     │
│  Middleware:                                                        │
│    helmet          ── Secure HTTP headers                           │
│    morgan          ── HTTP request logging                          │
│    cors            ── Cross-origin resource sharing                 │
│    express-rate-limit ── Abuse prevention                           │
│    auth.js         ── JWT verify middleware                         │
│                                                                     │
│  Routes → Controllers:                                              │
│    /api/auth/*     ── auth.controller.js  (bcrypt + JWT)           │
│    /api/chat/*     ── chat.controller.js  (sessions + messages)     │
│    /api/market/*   ── market.controller.js (static data)           │
│    /api/recommend  ── recommend.controller.js (wizard reports)      │
│                                                                     │
│  Services:                                                          │
│    gemini.service.js ── Gemini API wrapper + system prompt          │
│                                                                     │
│  Data:                                                              │
│    marketData.js   ── 8 hardcoded Indian city objects               │
└──────────────────┬─────────────────────────┬───────────────────────┘
                   │                         │
                   ▼                         ▼
     ┌─────────────────────┐     ┌────────────────────────┐
     │    SQLite Database  │     │    Google Gemini API    │
     │    (advisor.db)     │     │    gemini-2.0-flash     │
     │                     │     │                        │
     │  users              │     │  Model: 2.0-flash      │
     │  sessions           │     │  Max tokens: 2048      │
     │  messages           │     │  Temperature: 0.7      │
     │  recommendations    │     │  Context: full history │
     └─────────────────────┘     └────────────────────────┘
```

---

## 2. TECHNOLOGY STACK

### Runtime
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v24.x | JavaScript runtime |
| npm | v10.x | Package manager |

### Backend Dependencies
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.18.2 | HTTP server and routing |
| `knex` | ^3.1.0 | SQL query builder (promise-based) |
| `sqlite3` | ^5.1.7 | SQLite database driver (prebuilt binaries) |
| `@google/generative-ai` | ^0.21.0 | Google Gemini API client |
| `bcryptjs` | ^2.4.3 | Password hashing (pure JS, no native) |
| `jsonwebtoken` | ^9.0.2 | JWT generation and verification |
| `express-rate-limit` | ^7.2.0 | Request rate limiting |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing headers |
| `dotenv` | ^16.4.5 | Loads `.env` into `process.env` |
| `helmet` | ^7.1.0 | Security HTTP headers |
| `morgan` | ^1.10.0 | HTTP request logger |
| `nodemon` | ^3.1.0 | Auto-restart during development (devDep) |

### Frontend Dependencies (CDN — no install)
| Library | Source | Purpose |
|---|---|---|
| Inter Font | Google Fonts CDN | Typography |
| Marked.js | jsDelivr CDN | Markdown → HTML parsing for AI responses |

### Frontend (Vanilla — no framework, no bundler)
- HTML5
- Vanilla CSS (CSS Custom Properties / Variables)
- Vanilla JavaScript (ES6+, async/await, fetch API, classList API)

---

## 3. COMPLETE FILE TREE

```
d:\projects\Real-Estate-AI-Investment-Advisor\
│
├── .env                          # Runtime secrets (never commit — gitignored)
├── .env.example                  # Template — safe to commit
│     GEMINI_API_KEY=...
│     JWT_SECRET=...
│     PORT=3000
│
├── .gitignore                    # Excludes: .env, node_modules, *.db,
│                                 # OS files (.DS_Store, Thumbs.db),
│                                 # editor dirs (.vscode, .idea),
│                                 # logs, build output, walkthrough.md
│
├── package.json                  # Dependencies + npm scripts (start / dev)
├── README.md                     # GitHub README with badges, screenshots, quick start
├── LICENSE                       # MIT License
├── PROJECT_EXPLANATION.md        # Plain-English explanation of every decision
├── TECHNICAL_DETAILS.md          # This file — full technical reference
│
├── advisor.db                    # SQLite database — auto-created, gitignored
│                                 # (advisor.db-shm + advisor.db-wal are also gitignored)
│
├── docs/
│   └── screenshots/              # Live app screenshots committed to Git
│       ├── auth.png              # Login / Register screen
│       ├── chat.png              # AI Advisor chat page
│       ├── dashboard.png         # Market Overview (city cards)
│       ├── compare.png           # City Comparison table
│       └── wizard.png            # Investment Wizard
│
├── server/
│   ├── index.js                  # Express entry point + server start
│   ├── db.js                     # Knex setup + table initialization
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT Bearer token verification
│   │   └── rateLimiter.js        # express-rate-limit configurations
│   │
│   ├── routes/
│   │   ├── auth.routes.js        # POST /register, /login; GET /me
│   │   ├── chat.routes.js        # POST /message; GET+DELETE /sessions
│   │   ├── market.routes.js      # GET /cities, /cities/:slug, /compare
│   │   └── recommend.routes.js   # POST /; GET /history
│   │
│   ├── controllers/
│   │   ├── auth.controller.js    # register, login, me
│   │   ├── chat.controller.js    # sendMessage, getSessions, getSession, deleteSession
│   │   ├── market.controller.js  # getCities, getCity, compareCities
│   │   └── recommend.controller.js # generate, getHistory
│   │
│   ├── services/
│   │   └── gemini.service.js     # chat(), generateRecommendation()
│   │
│   └── data/
│       └── marketData.js         # 8 city objects (Indian real estate data)
│
└── public/                       # Static files served by Express
    ├── index.html                # App shell — entire SPA in one HTML file
    │
    ├── css/
    │   └── styles.css            # Full design system (~700 lines)
    │
    └── js/
        ├── api.js                # Fetch wrapper + JWT header injection
        ├── auth.js               # Auth state (localStorage) + form UI
        ├── chat.js               # Chat interface + session sidebar
        ├── dashboard.js          # Market cards + filter/sort logic
        ├── compare.js            # City comparison table
        ├── wizard.js             # 4-step wizard + AI report rendering
        └── app.js                # SPA router + toast system + boot
```

---

## 4. REST API SPECIFICATION

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "securepass123"
}
```

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
}
```

**Error Responses:**
- `400` — Missing fields or password < 6 chars
- `409` — Email already registered

---

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "rahul@example.com",
  "password": "securepass123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "Rahul Sharma", "email": "rahul@example.com" }
}
```

**Error Responses:**
- `401` — Invalid email or password

---

#### GET /api/auth/me
Get current user info. **Requires JWT.**

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "created_at": "2026-03-28T12:00:00.000Z"
  }
}
```

---

### Chat Endpoints

#### POST /api/chat/message
Send a message to the AI advisor. **Requires JWT. Rate limited: 30/hour.**

**Request Body:**
```json
{
  "message": "What are the best areas in Noida for a ₹1 Cr budget?",
  "sessionId": null
}
```
> Pass `sessionId: null` to start a new session. Pass an existing session ID to continue.

**Success Response (200):**
```json
{
  "sessionId": 3,
  "response": "📍 Recommended Locations:\n\n1. **Noida Sector 150**..."
}
```

---

#### GET /api/chat/sessions
List all chat sessions for the logged-in user. **Requires JWT.**

**Success Response (200):**
```json
{
  "sessions": [
    {
      "id": 3,
      "title": "What are the best areas in Noida for a ₹1 Cr...",
      "created_at": "2026-03-28T12:30:00.000Z",
      "updated_at": "2026-03-28T12:31:00.000Z"
    }
  ]
}
```

---

#### GET /api/chat/sessions/:id
Get all messages within a session. **Requires JWT.**

**Success Response (200):**
```json
{
  "session": { "id": 3, "title": "...", "created_at": "..." },
  "messages": [
    { "id": 1, "role": "user", "content": "What are...", "created_at": "..." },
    { "id": 2, "role": "model", "content": "📍 Recommended...", "created_at": "..." }
  ]
}
```

---

#### DELETE /api/chat/sessions/:id
Delete a session and all its messages. **Requires JWT.**

**Success Response (200):**
```json
{ "success": true }
```

---

### Market Data Endpoints

These are **public** — no JWT required.

#### GET /api/market/cities
Get all 8 city data objects.

**Optional query params:**
- `?budget=1.5` — filter cities where `priceRangeMin <= 1.5` (in Cr)
- `?city=Noida` — filter by city name (partial match)

**Success Response (200):**
```json
{
  "cities": [
    {
      "slug": "noida-sector-150",
      "name": "Noida Sector 150",
      "city": "Noida",
      "state": "Uttar Pradesh",
      "priceRangeMin": 0.8,
      "priceRangeMax": 1.5,
      "priceUnit": "Cr",
      "roiMin": 12,
      "roiMax": 15,
      "rentalYieldMin": 3.5,
      "rentalYieldMax": 4.5,
      "growth": "High",
      "riskLevel": "Medium",
      "propertyTypes": ["Flat", "Apartment"],
      "highlights": ["..."],
      "infrastructure": "...",
      "verdict": "Best for long-term appreciation",
      "demandScore": 88,
      "avgPricePerSqFt": { "min": 5500, "max": 8500 }
    }
  ]
}
```

---

#### GET /api/market/cities/:slug
Get a single city's data.

**Example:** `GET /api/market/cities/hyderabad-hitech-city`

---

#### GET /api/market/compare
Compare 2 or 3 cities.

**Query param:** `?cities=slug1,slug2,slug3`

**Example:** `GET /api/market/compare?cities=noida-sector-150,gurgaon-dwarka-expressway`

**Success Response (200):**
```json
{
  "comparison": [ { /* city 1 full object */ }, { /* city 2 full object */ } ]
}
```

---

### Recommendation Endpoints

#### POST /api/recommend
Generate a personalized investment report. **Requires JWT. Rate limited: 30/hour.**

**Request Body:**
```json
{
  "budget": "1.5",
  "budgetUnit": "Cr",
  "city": "Bangalore",
  "goal": "Rental income — I want monthly passive income",
  "propertyType": "Flat / Apartment",
  "additionalNotes": "Looking for RERA certified projects only"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "report": "# Investment Report\n\n📍 Recommended Locations:..."
}
```

---

#### GET /api/recommend/history
Get all past wizard reports. **Requires JWT.**

**Success Response (200):**
```json
{
  "recommendations": [
    {
      "id": 1,
      "input": {
        "budget": "1.5",
        "budgetUnit": "Cr",
        "city": "Bangalore",
        "goal": "Rental income...",
        "propertyType": "Flat / Apartment"
      },
      "report": "# Investment Report\n...",
      "created_at": "2026-03-28T12:45:00.000Z"
    }
  ]
}
```

---

## 5. DATABASE SCHEMA

### ERD (Entity Relationship Diagram)
```
users (1) ──< sessions (1) ──< messages
  │
  └──< recommendations
```

### Table: users
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `name` | TEXT | NOT NULL |
| `email` | TEXT | UNIQUE, NOT NULL |
| `password` | TEXT | NOT NULL (bcrypt hash) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### Table: sessions
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `user_id` | INTEGER | FK → users.id, ON DELETE CASCADE |
| `title` | TEXT | DEFAULT 'New Conversation' |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### Table: messages
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `session_id` | INTEGER | FK → sessions.id, ON DELETE CASCADE |
| `role` | TEXT | ENUM('user', 'model'), NOT NULL |
| `content` | TEXT | NOT NULL |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### Table: recommendations
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `user_id` | INTEGER | FK → users.id, ON DELETE CASCADE |
| `input_json` | TEXT | NOT NULL (serialized wizard inputs) |
| `report` | TEXT | NOT NULL (full AI-generated markdown) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## 6. JWT TOKEN STRUCTURE

**Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload:**
```json
{
  "id": 1,
  "email": "rahul@example.com",
  "name": "Rahul Sharma",
  "iat": 1711625400,
  "exp": 1712230200
}
```
> Token expires in **7 days** from issue. No refresh token — user re-logs in.

**Signing Algorithm:** HMAC-SHA256 using `JWT_SECRET` from `.env`

---

## 7. RATE LIMITING CONFIGURATION

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| General | 15 minutes | 100 | All `/api/*` routes |
| AI | 1 hour | 30 | `/api/chat/message`, `/api/recommend` |

When exceeded, returns:
```json
{ "error": "AI request limit reached (30/hour). Please try again later." }
```

---

## 8. GEMINI AI CONFIGURATION

| Setting | Value |
|---|---|
| Model | `gemini-2.0-flash` |
| Max output tokens | 2048 |
| Temperature | 0.7 (balanced creativity / factual) |
| System instruction | Full advisor persona (see gemini.service.js) |
| Context window | Last 20 messages from the session |

**System Prompt Summary:**
- Acts as an expert Indian real estate advisor
- Always uses ₹ for prices
- Provides Top 3 recommendations with ROI %, rental yield %, growth rating
- Outputs in structured format: 📍 Recommended Locations + 📊 Summary
- Does NOT hallucinate specific listings — uses realistic ranges
- Focuses on 2024–2025 Indian market data

---

## 9. DESIGN SYSTEM (CSS Variables)

```css
/* Colors */
--bg:           hsl(220, 22%, 7%)     /* Page background */
--bg-2:         hsl(220, 18%, 10%)    /* Sidebar background */
--surface:      hsl(220, 15%, 13%)    /* Card backgrounds */
--surface-2:    hsl(220, 13%, 17%)    /* Input backgrounds */
--glass:        rgba(255,255,255,.04) /* Glassmorphism overlay */
--glass-border: rgba(255,255,255,.08) /* Subtle borders */

--gold:         hsl(45, 95%, 55%)     /* Primary: buttons, active states */
--gold-dim:     hsla(45, 95%, 55%, .15) /* Gold tint backgrounds */
--gold-border:  hsla(45, 95%, 55%, .3)  /* Gold borders */

--blue:         hsl(210, 90%, 60%)    /* AI avatar, secondary accent */
--green:        hsl(145, 70%, 50%)    /* ROI, positive metrics */
--red:          hsl(0, 75%, 60%)      /* Errors, danger states */

--text:         hsl(220, 15%, 92%)    /* Primary text */
--text-2:       hsl(220, 10%, 65%)    /* Secondary text */
--text-3:       hsl(220, 8%, 45%)     /* Muted/hint text */

/* Layout */
--sidebar-w:    280px                 /* Sidebar width */
--radius:       14px                  /* Default border radius */
--radius-sm:    8px                   /* Small border radius */
--radius-lg:    20px                  /* Large border radius */

/* Font */
Inter (Google Fonts) — weights: 300, 400, 500, 600, 700, 800
```

---

## 10. FRONTEND MODULE RESPONSIBILITIES

| File | Lines | Key Exports / Globals |
|---|---|---|
| `api.js` | ~60 | `window.api` — all API call methods |
| `auth.js` | ~90 | `window.Auth`, `window.initAuthUI` |
| `app.js` | ~70 | `window.app`, `window.showToast`, `window.navigate` |
| `chat.js` | ~200 | `window.initChat`, `window.loadSessions` |
| `dashboard.js` | ~110 | `window.initDashboard` |
| `compare.js` | ~140 | `window.initCompare` |
| `wizard.js` | ~110 | `window.initWizard` |

**Load order in index.html:**
```html
<script src="/js/api.js"></script>        <!-- 1. API client (no deps) -->
<script src="/js/auth.js"></script>       <!-- 2. Auth (uses api) -->
<script src="/js/chat.js"></script>       <!-- 3. Chat (uses api, Auth) -->
<script src="/js/dashboard.js"></script>  <!-- 4. Dashboard (uses api) -->
<script src="/js/compare.js"></script>    <!-- 5. Compare (uses api) -->
<script src="/js/wizard.js"></script>     <!-- 6. Wizard (uses api) -->
<script src="/js/app.js"></script>        <!-- 7. App router (uses all) -->
```

---

## 11. SPA ROUTING MECHANISM

The app uses a custom zero-dependency SPA router:

```javascript
// Pages are simple divs with class="page-panel"
// Only the one with class="active" is visible (display: flex)

function navigate(page) {
  // 1. Update nav link active states
  // 2. Show/hide page panels via .active class
  // 3. Lazy-initialize the page module on first visit
}
```

No history API / URL changes are used — navigation is purely visual state management.
The Express catch-all always returns `index.html` for any non-API URL.

---

## 12. RUNNING THE APPLICATION

### Development
```bash
# 1. Clone / open the project
cd d:\projects\Real-Estate-AI-Investment-Advisor

# 2. Install dependencies (already done if node_modules exists)
npm install

# 3. Configure environment
# Copy .env.example to .env
# Fill in GEMINI_API_KEY and JWT_SECRET

# 4. Start the dev server (auto-restarts on file changes)
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Production
```bash
npm start
```

### Environment Variables Required
```env
GEMINI_API_KEY=   # From https://aistudio.google.com/
JWT_SECRET=       # Any long random string (e.g. openssl rand -base64 32)
PORT=3000         # Optional, defaults to 3000
```

---

## 13. INDIAN REAL ESTATE DATA REFERENCE

All data is curated from publicly available market estimates (2024–2025).
These are ranges, not exact figures.

| Slug | City | Price (₹ Cr) | ROI | Yield | Demand Score |
|---|---|---|---|---|---|
| `noida-sector-150` | Noida, UP | 0.8–1.5 | 12–15% | 3.5–4.5% | 88 |
| `gurgaon-dwarka-expressway` | Gurgaon, Haryana | 1.2–2.5 | 10–13% | 3–4% | 84 |
| `delhi-l-zone-dwarka` | Delhi | 1.5–3.0 | 8–11% | 2.5–3.5% | 72 |
| `mumbai-navi-mumbai-panvel` | Mumbai, Maharashtra | 0.7–1.8 | 11–14% | 4–5% | 90 |
| `bangalore-sarjapur-road` | Bangalore, Karnataka | 0.9–2.2 | 13–16% | 4–5.5% | 92 |
| `pune-hinjewadi` | Pune, Maharashtra | 0.6–1.4 | 12–15% | 4–5% | 87 |
| `hyderabad-hitech-city` | Hyderabad, Telangana | 0.8–1.8 | 13–17% | 4.5–5.5% | 95 |
| `chennai-omr` | Chennai, Tamil Nadu | 0.5–1.3 | 10–13% | 4–5% | 75 |

---

## 14. SECURITY CHECKLIST

- [x] API key never sent to browser (server-side only)
- [x] Passwords hashed with bcrypt (salt rounds: 10)
- [x] JWT with expiry (7 days)
- [x] All protected routes behind `auth` middleware
- [x] Data isolation: every query includes `WHERE user_id = ?`
- [x] Rate limiting on AI endpoints (30 req/hour)
- [x] `helmet()` for secure HTTP headers
- [x] `.env`, `advisor.db`, `node_modules`, `package-lock.json` all in `.gitignore`
- [x] Input validation on all write endpoints
- [x] `cors` configured (same-origin safe for production)
- [x] SQLite WAL journal files excluded from Git (prevent partial DB commits)

---

*PropIQ — AI Real Estate Investment Advisor for India*
*Stack: Node.js · Express · SQLite (knex) · Vanilla JS · Google Gemini 2.0 Flash*
