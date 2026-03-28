# PropIQ — Complete Project Explanation

> **What is PropIQ?**
> PropIQ is a full-stack, AI-powered Real Estate Investment Advisor web application
> built specifically for Indian property markets. It helps users make smart, data-driven
> investment decisions across cities like Noida, Gurgaon, Delhi, Mumbai, Bangalore,
> Pune, Hyderabad, and Chennai — powered by Google's Gemini AI.

---

## 1. WHY THIS WAS BUILT

The goal was to create a professional-grade tool that acts as a personal real estate
consultant for Indian investors. Instead of giving vague general advice, it provides:

- **Specific location recommendations** with price ranges, ROI %, and rental yield %
- **Data-driven comparisons** between Indian cities
- **A conversational AI** that remembers your context across a session
- **A step-by-step wizard** that generates a full personalized investment report
- **Saved history** so users can revisit past conversations and reports

---

## 2. THE JOURNEY — DECISION BY DECISION

### Step 1: Defining the Scope
The original request was for an AI chatbot with Indian real estate expertise.
The scope was expanded to include:
- A proper backend (not just client-side)
- A database for storing user data and chat history
- Multi-page SPA with 4 distinct tools

### Step 2: Choosing the Tech Stack
- **Node.js + Express** for the backend — fast to write, same language as frontend
- **SQLite** for the database — chosen specifically because it requires ZERO setup.
  No installation, no cloud account, no configuration. Just a single `.db` file
  that auto-creates itself the first time the server starts.
- **Knex.js** as the SQLite query builder — provides a clean, promise-based API
  that works well with async/await and avoids raw SQL strings everywhere
- **Vanilla HTML/CSS/JS** for the frontend — no React, no Vue, no build step.
  The entire frontend is plain files served directly by Express. This keeps things
  simple, fast, and easy to understand.
- **Google Gemini 2.0 Flash** for the AI — free tier, fast responses, great at
  structured Indian real estate advice

### Step 3: Why NOT MongoDB?
MongoDB was the original plan but was swapped for SQLite because:
- MongoDB requires either a cloud account (Atlas) or a local installation
- SQLite needs nothing — it's just a file
- For a project of this size, SQLite is more than powerful enough
- It's what WhatsApp used for years to store billions of messages

### Step 4: The `better-sqlite3` Problem
The first SQLite library chosen (`better-sqlite3`) failed to install because it
requires Python + node-gyp to compile native C++ bindings, and the user's system
(Node v24 / Windows) didn't have a compatible build environment.

The fix: switched to `sqlite3` + `knex`. The `sqlite3` package has **pre-built
binaries** for Windows, so it installs without any compilation. `knex` wraps it
in a clean async API.

---

## 3. WHAT WAS BUILT — FILE BY FILE

### Root Level
```
.env                    Your secrets (API key, JWT secret) — never committed to Git
.env.example            Template showing which variables are needed (safe to commit)
.gitignore              Excludes secrets, DB, node_modules, OS files, editor dirs
package.json            Lists all dependencies and npm scripts
README.md              GitHub-facing documentation with screenshots and quick start
LICENSE                 MIT License
PROJECT_EXPLANATION.md Plain-English explanation of every decision and file (this file)
TECHNICAL_DETAILS.md   Full API reference, DB schema, architecture diagram
advisor.db              The SQLite database file — auto-created on first server start
                        (gitignored — every developer gets their own local DB)
```

---

### Backend: server/index.js
**What it does:** The main entry point of the application. It:
- Loads environment variables from `.env`
- Sets up all security middleware (helmet, cors, rate limiting)
- Registers all API route groups (`/api/auth`, `/api/chat`, `/api/market`, `/api/recommend`)
- Serves the entire `public/` folder as static files (so the browser can access HTML/CSS/JS)
- Provides a catch-all fallback that sends `index.html` for any URL not matched by the API
  (this is what makes the single-page app routing work)
- Initializes the SQLite database before starting the HTTP listener

**Why it matters:** This is the "glue" file. Everything flows through here.

---

### Backend: server/db.js
**What it does:** Manages the database connection and schema creation. It:
- Creates a Knex connection to the `advisor.db` SQLite file
- Checks if each table exists (users, sessions, messages, recommendations)
- Creates any missing table with the correct columns and relationships
- Enables foreign key enforcement and WAL mode for better performance

**Why it matters:** Tables are created automatically on first run. No manual SQL
needed. No migration scripts needed. The developer just runs the server and it works.

---

### Backend: server/middleware/auth.js
**What it does:** A middleware function that runs on protected routes. It:
- Reads the `Authorization: Bearer <token>` header from the HTTP request
- Verifies the JWT token using the secret from `.env`
- If valid, attaches the decoded user info (`id`, `email`, `name`) to `req.user`
- If invalid or missing, returns a 401 or 403 error immediately

**Why it matters:** This is the security guard. Every chat message, recommendation,
and history fetch goes through this. Users cannot access each other's data.

---

### Backend: server/middleware/rateLimiter.js
**What it does:** Sets limits on how many requests can be made. Two limiters:
- **General:** 100 requests per 15 minutes (applies to all /api routes)
- **AI limiter:** 30 AI requests per hour (applies to `/api/chat/message` and `/api/recommend`)

**Why it matters:** Without rate limiting, a single user could spam the Gemini API
and incur large costs. This protects against abuse.

---

### Backend: server/services/gemini.service.js
**What it does:** The bridge between the app and Google's Gemini AI. It contains:

1. **The System Prompt** — A detailed persona instruction that tells Gemini to act as
   an expert Indian real estate advisor. It specifies:
   - Always use ₹ for prices
   - Give Top 3 location recommendations with ROI %, rental yield %, and growth rating
   - Use the specific structured output format (📍 Recommended Locations, 📊 Summary)
   - Don't hallucinate specific listings — use realistic ranges
   - Focus on 2024-2025 Indian market realities

2. **`chat()` function** — Sends a user message to Gemini along with the full
   conversation history (so Gemini remembers context). Returns the AI's response text.

3. **`generateRecommendation()` function** — Takes the wizard form inputs (budget,
   city, goal, property type) and assembles a detailed prompt asking for a full
   investment report. Returns the formatted report text.

**Why it matters:** The Gemini API key lives only here, on the server. The browser
never sees it. This is the key security advantage of having a backend.

---

### Backend: server/data/marketData.js
**What it does:** A JavaScript array of 8 carefully curated city objects, each containing:
- `slug` — URL-safe identifier (e.g. `noida-sector-150`)
- `name`, `city`, `state`
- `priceRangeMin` / `priceRangeMax` — in ₹ Crore
- `roiMin` / `roiMax` — expected return on investment %
- `rentalYieldMin` / `rentalYieldMax` — annual rental income as % of property value
- `growth` — qualitative growth rating (Medium / High / Very High)
- `riskLevel` — risk assessment
- `highlights` — 5 bullet points about the location
- `infrastructure` — a paragraph about connectivity and development
- `verdict` — the advisor's final recommendation label
- `demandScore` — a 0–100 score representing market demand
- `avgPricePerSqFt` — price range per square foot

**Cities covered:**
1. Noida Sector 150 (Uttar Pradesh)
2. Gurgaon Dwarka Expressway (Haryana)
3. Delhi L-Zone / Dwarka (Delhi)
4. Navi Mumbai / Panvel (Maharashtra)
5. Bangalore Sarjapur Road (Karnataka)
6. Pune Hinjewadi (Maharashtra)
7. Hyderabad HITECH City (Telangana)
8. Chennai OMR (Tamil Nadu)

**Why it matters:** These are realistic, well-researched estimates — not hallucinated.
They're based on publicly known Indian real estate market ranges as of 2024-2025.
The AI gets to reference this data, and the dashboard/comparison tools display it directly.

---

### Backend: server/controllers/ (4 files)

#### auth.controller.js
Handles user registration and login:
- **Register:** Validates inputs → checks for duplicate email → hashes password
  with bcrypt (10 rounds) → saves to `users` table → returns JWT token
- **Login:** Looks up email → compares password hash → returns JWT token
- **Me:** Returns the logged-in user's profile from the database

#### chat.controller.js
Handles the AI conversation:
- **sendMessage:** Creates or resumes a session → fetches last 20 messages for
  context → sends to Gemini → saves both the user message and AI response to the
  `messages` table → updates session timestamp
- **getSessions:** Returns all sessions for the logged-in user, newest first
- **getSession:** Returns all messages within a specific session
- **deleteSession:** Removes a session and all its messages (foreign key cascade)

#### market.controller.js
Serves the curated city data:
- **getCities:** Returns all 8 cities, with optional filtering by budget or city name
- **getCity:** Returns a single city by slug
- **compareCities:** Takes 2-3 city slugs and returns their full data for side-by-side display

#### recommend.controller.js
Handles the investment wizard:
- **generate:** Takes budget/city/goal/propertyType → calls Gemini → saves the
  full report to the `recommendations` table → returns it to the frontend
- **getHistory:** Returns all past wizard reports for the logged-in user

---

### Backend: server/routes/ (4 files)

Each routes file is a simple Express Router that maps HTTP methods + paths to
the correct controller function, and applies middleware (auth, rate limiting) where needed.

| Route File | Prefix | Protected? |
|---|---|---|
| auth.routes.js | /api/auth | Partially (only /me) |
| chat.routes.js | /api/chat | All routes |
| market.routes.js | /api/market | None (public data) |
| recommend.routes.js | /api/recommend | All routes |

---

### Frontend: public/index.html
**What it does:** The single HTML file for the entire app. It's a shell that contains:
- The auth screen (login / register form)
- The main app screen (sidebar + 4 page panels)
- All the structural HTML for: chat, market dashboard, city comparison, investment wizard

The page never reloads. JavaScript shows/hides sections by adding/removing the
`active` CSS class. This is the Single Page Application (SPA) pattern.

**Key design decisions:**
- Auth screen and app screen are separate `<div>` elements — one is always `hidden`
- The sidebar contains navigation links AND the chat sessions list
- Each page (chat, dashboard, compare, wizard) is a `<div class="page-panel">` —
  only the active one is visible at any time

---

### Frontend: public/css/styles.css
**What it does:** The complete visual language of the app. Key design choices:

**Color System:**
- Background: Very dark blue-grey `hsl(220, 22%, 7%)`
- Surface: Slightly lighter dark `hsl(220, 15%, 13%)`
- Glass: Near-transparent white overlay with backdrop blur (the glassmorphism effect)
- Gold `hsl(45, 95%, 55%)` — primary accent, used for active states, buttons, AI chat highlights
- Blue `hsl(210, 90%, 60%)` — secondary accent, used for AI avatar, AI-related elements
- Green `hsl(145, 70%, 50%)` — ROI and positive metrics
- Red `hsl(0, 75%, 60%)` — errors and warnings

**Typography:** Inter font from Google Fonts at weights 300, 400, 500, 600, 700, 800

**Key Components Styled:**
- Auth screen with background radial gradient glow
- Dark sidebar with session list and hover effects
- Chat messages with avatar bubbles (gold for user, blue for AI)
- Typing indicator with bouncing dots animation
- City cards with animated demand progress bars
- Comparison table with winner cells highlighted in gold
- 4-step wizard with progress bar and radio card options
- Toast notification system (top-right, slides in/out)
- Responsive layout for mobile (sidebar collapses off-screen)

---

### Frontend: public/js/api.js
**What it does:** A centralized HTTP client. Every API call in the app goes through
this one file. It:
- Reads the JWT token from localStorage
- Adds `Authorization: Bearer <token>` header automatically
- Wraps `fetch()` in a cleaner async function
- Throws proper error messages from the server response

This means: if you want to add a new API call anywhere in the app, you add one
line to `api.js` and use it everywhere else. No copy-pasting fetch code.

---

### Frontend: public/js/auth.js
**What it does:** Manages the authentication state and drives the login/register UI.

- **Auth object:** Stores/retrieves JWT and user profile from `localStorage`
- Provides `isLoggedIn()`, `save()`, `clear()`, `logout()` methods
- Drives the tab switching between Sign In / Create Account forms
- Handles form submission with loading state on the button
- On success: calls `app.initApp()` to transition to the main screen
- On error: shows the error message below the form

---

### Frontend: public/js/chat.js
**What it does:** The full chat interface — the most complex frontend file. It handles:

- **`appendMessage()`** — Creates a message bubble DOM element with the correct
  styling (user = gold, AI = dark surface) and appends it to the chat container
- **`renderMarkdown()`** — Uses the Marked.js CDN library to convert the AI's
  markdown response (with headers, bullet lists, tables, bold text) into HTML
- **`showTypingIndicator()`** — Shows animated bouncing dots while waiting for Gemini
- **`sendChatMessage()`** — Disables input, shows typing indicator, calls the API,
  removes typing indicator, renders the response, refreshes the sidebar
- **`loadSessions()`** — Fetches all sessions from the backend and renders them in the sidebar
- **`loadSessionMessages()`** — Loads a past session's messages and replays them in the chat area
- **`renderWelcomeChips()`** — Shows the welcome screen with 6 pre-written questions
  the user can click to instantly start a conversation
- **`initChat()`** — Sets up all event listeners (Enter key, send button, new chat button)

---

### Frontend: public/js/dashboard.js
**What it does:** Renders the Market Overview page. It:

- Fetches city data from `/api/market/cities`
- Creates a card for each city using `createCityCard()`
- Each card shows: city name, state, price range, ROI, rental yield, risk, demand bar, highlights, verdict
- Animates the demand progress bars after the cards are painted (width slides from 0 to the score)
- Handles the Search by city name filter (real-time, as you type)
- Handles the Budget filter (dropdown — shows only cities within budget)
- Handles the Sort buttons (by ROI, rental yield, price, or demand score)

---

### Frontend: public/js/compare.js
**What it does:** Drives the City Comparison tool. It:

- Populates 3 city dropdowns with all available city slugs
- Pre-selects Noida and Gurgaon as defaults and auto-runs the comparison
- Calls `/api/market/compare?cities=slug1,slug2` with the selected cities
- Builds the comparison table dynamically with rows for Price, ROI, Yield, Growth, Risk, Demand, Property Types, Verdict
- Highlights the **winner** in each numerical category with a gold background and a "Best X" label
- Shows infrastructure notes for each selected city below the table

---

### Frontend: public/js/wizard.js
**What it does:** Controls the 4-step investment wizard. It:

- Tracks the current step (1-4)
- Updates the progress bar and step indicator circles on each transition
- Validates each step before allowing Next (e.g., budget must be > 0, goal must be selected)
- Collects all inputs into a `wizardData` object
- On Step 4 "Generate Report": calls `/api/recommend`, shows a loading spinner,
  then renders the AI's markdown report
- Provides "Copy Report" (copies text to clipboard) and "Start Over" (resets form)

---

### Docs: docs/screenshots/ (5 files)
**What it does:** Stores real screenshots of the live app for use in the GitHub README.

| File | Page Shown |
|---|---|
| `auth.png` | Login / Register screen |
| `chat.png` | AI Advisor chat with welcome chips |
| `dashboard.png` | Market Overview with city cards |
| `compare.png` | City Comparison table with winner highlights |
| `wizard.png` | Investment Wizard step 1 |

**Why it matters:** Screenshots are committed to Git inside `docs/` so GitHub renders
them inline in the README, giving visitors an immediate visual preview of the app
without needing to run it locally.

---

### Frontend: public/js/app.js
**What it does:** The bootstrap and SPA router. It:

- Defines `navigate(page)` — shows the correct page panel and calls the init
  function for that page (lazily, on first visit only)
- Defines `showToast(message, type)` — creates temporary notification pop-ups
- On `DOMContentLoaded`: checks if a JWT exists in localStorage. If yes, goes
  straight to the app. If no, shows the auth screen.
- Wires up nav link clicks, logout button, and mobile sidebar toggle
- Updates the user's name in the sidebar footer

---

## 4. THE USER EXPERIENCE FLOW

```
User visits localhost:3000
        │
        ├── No token in localStorage → Auth Screen
        │         │
        │         ├── Register → account created, JWT saved, → App
        │         └── Login → JWT saved → App
        │
        └── Token exists → App (straight in)
                  │
                  ├── Chat Page (default)
                  │       │
                  │       ├── Type a question → AI responds → saved to DB
                  │       ├── Click quick chip → instant question
                  │       └── Click past session → restore conversation
                  │
                  ├── Market Data Page
                  │       └── Browse 8 cities │ Filter │ Sort
                  │
                  ├── Compare Cities Page
                  │       └── Pick 2-3 cities → see winner per metric
                  │
                  └── Investment Wizard Page
                          └── 4 steps → Generate AI report → Copy it
```

---

## 5. SECURITY MODEL

| Concern | Solution |
|---|---|
| API Key exposure | Gemini key lives in `.env` on server, never sent to browser |
| Password storage | bcryptjs with 10 rounds of hashing |
| Session auth | JWT with 7-day expiry, verified on every protected request |
| Request abuse | Rate limiting: 100 req/15min general, 30 AI req/hour |
| HTTP hardening | `helmet` sets secure HTTP headers (X-Frame-Options, etc.) |
| Data isolation | Every DB query filters by `user_id` — no cross-user data access |
| Git safety | `.env`, `advisor.db`, `node_modules` all in `.gitignore` — never committed |

---

## 6. DATABASE DESIGN

4 tables, designed to cascade on deletion (delete a user → all their data goes):

```
users
  └── sessions (one user → many sessions)
        └── messages (one session → many messages)
  └── recommendations (one user → many wizard reports)
```

---

## 7. WHAT MAKES THIS DIFFERENT FROM A SIMPLE CHATBOT

| Simple chatbot | PropIQ |
|---|---|
| No memory between page reloads | Full chat history in SQLite |
| Client-side API key (insecure) | Server-side API proxy (secure) |
| Generic AI personality | Expert Indian real estate advisor persona |
| No data | 8 cities of curated market data |
| One feature | 4 tools: Chat, Dashboard, Compare, Wizard |
| No user accounts | JWT auth with per-user data isolation |

---

*Built with Node.js + Express + SQLite (knex) + Vanilla JS + Google Gemini 2.0 Flash*
