# 🧑‍✈️ TaskPilot AI
> **Smart Cognitive Flow Planner**  
> *Google Vibe2Ship Hackathon Entry*

TaskPilot AI is an AI-powered productivity companion designed to help users actively complete high-value tasks before deadlines rather than simply reminding them. Designed with the aesthetics of Notion AI, Sunsama, and Motion, it uses Gemini intelligence to automatically construct daily schedules, predict deadline risks, and offer professional coaching insights.

---

## 🚀 Key Features

### 1. 🧠 Dynamic Scheduling & Optimization
- **Smart Timeline**: Converts lists of active tasks into sequential, non-overlapping daily schedules.
- **Cognitive Load Analysis**: Predicts deadline risks and provides early warnings when focus times exceed realistic bounds.
- **Focal Peak Points**: Identifies times of high productivity (e.g., morning peak performance) to schedule core focus blocks.

### 2. 🎯 Immersive Focus Mode
- **Single-Tasking Discipline**: Allows users to choose their current target and enter a full-screen, distraction-free environment.
- **Haptic & Visual Rhythms**: Staggered transitions and micro-animations reinforce deep cognitive focus.

### 3. 📊 Analytics Engine & Heatmaps
- **Completion Density**: Displays daily progress logs and weekly heatmaps mapping active completed sprint blocks.
- **Productivity Score**: Calibrates and tracks a dynamic productivity coefficient calculated from active task completions.

### 4. 📲 Progressive Web App (PWA)
- **Offline Caching**: Core assets are fully cached by a custom Service Worker (`sw.js`) for fast offline loading.
- **Installable Desktop/Mobile App**: Uses responsive high-contrast launcher icons (`pilot-hat.png`) for seamless standalone application feel.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS (v4), Motion (React animations), Lucide Icons
- **Backend Service**: Node.js, Express, esbuild
- **AI Intelligence**: Google Gemini API via `@google/genai` TypeScript SDK
- **Data Persistence**: Firebase Authentication, Cloud Firestore
- **Production Infrastructure**: Docker (multi-stage Alpine configurations), ready for Google Cloud Run deployment

---

## 📂 Project Architecture

The codebase adheres strictly to clean architectural principles, separating UI, business logic, and API data layers:

```
├── .dockerignore           # Production container build exclusions
├── .env.example            # Template for environment variables and secrets
├── Dockerfile              # Multi-stage production Docker build
├── firebase-applet-config.json # Direct Firebase integration settings
├── package.json            # Script definitions and npm dependencies
├── public/                 # Static assets, logos, and PWA configuration
│   ├── manifest.json       # App installability manifest
│   └── sw.js               # Service Worker managing offline caches
├── server.ts               # Production custom Express-Vite backend
├── src/                    # React frontend architecture
│   ├── main.tsx            # App entry point & error handlers
│   ├── App.tsx             # Main layout, routing, and navigation
│   ├── index.css           # Global theme colors and Space Grotesk/Inter fonts
│   ├── contexts/           # Authentication and state contexts
│   ├── firebase/           # DB initialization and connection handlers
│   ├── pages/              # Responsive page components (Dashboard, Analytics, etc.)
│   └── types/              # Declarative TypeScript models and enums
└── vite.config.ts          # Build plugin rules and configurations
```

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/taskpilot-ai.git
cd taskpilot-ai

# Install package dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on the `.env.example` template:
```env
GEMINI_API_KEY="your-gemini-api-key"
VITE_APP_NAME="TaskPilot AI"
NODE_ENV="development"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
The application will boot in development mode on `http://localhost:3000`.

---

## 🏗️ Production Build & Deployment

### 1. Compile Locally
To run a production-ready compilation of both the React client assets and the Express backend:
```bash
npm run build
npm start
```
This builds static assets into `dist/` and compiles `server.ts` into a self-contained CJS bundle inside `dist/server.cjs` for fast startup.

### 2. Containerized Build (Docker)
Build the production-optimized multi-stage Docker image:
```bash
docker build -t taskpilot-ai:latest .
```

### 3. Google Cloud Run Deployment
Deploy the container directly to Google Cloud Run to achieve auto-scaling and managed TLS:
```bash
gcloud run deploy taskpilot-ai \
  --image gcloud-cr-path/taskpilot-ai:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your-api-key,NODE_ENV=production"
```

---

## 🛡️ Security & Offline Hardening
- **Server-Side API proxying**: API keys are completely protected from the browser. The client invokes local Express endpoints (`/api/gemini/optimize`) to interact with Gemini.
- **Graceful Fault Recovery**: If the Gemini API hits quotas or rate limits, the server automatically degrades to local heuristic-based prioritization to ensure the application remains functional and doesn't display empty grids.
- **Error Boundaries**: Sandboxed extension exceptions are caught at the root level and suppressed to preserve iframe rendering performance.

---

## 🏆 Hackathon Alignment

TaskPilot AI solves the key Vibe2Ship productivity problem statement by:
1. **Shifting focus from reminders to actionability**: Offering clear schedules and focus blocks.
2. **Integrating deep Google services**: Utilizing Google Cloud Run, Cloud Firestore, and Gemini models.
3. **Designing a production-quality SaaS experience**: Ensuring standalone PWA installation, zero-flicker transitions, and offline capabilities.
