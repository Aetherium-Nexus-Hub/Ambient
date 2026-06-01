# Ambient OS // Animus 4.0 Nexus

Ambient OS is a high-performance, dark cybernetic AI telemetry platform designed specifically for psytrance producers, DJs, and creative sound architects. Integrating deep machine intelligence, real-time audio pipeline resolution, and autonomous service coordination, Ambient OS visualizes, secures, and plans sonic structures and "genetic sets".

---

## 🎨 Design Vision & Aesthetic

Ambient OS utilizes an immersive **Cosmic Slate Theme** framed by crisp digital typography and responsive micro-animations:
*   **High-Contrast Color Palette**: Ambient dark background canvas (`#020406`) accented with vibrant neural-blue (`#00D4FF`), emerald-green (`#10B981`) telemetry states, and warning-amber accents.
*   **Aesthetic Typography**: Styled using clean *Inter* geometric display tracking, combined with raw *JetBrains Mono* indicators simulating high-frequency terminals.
*   **Tactile Interfaces**: Built with active responsive feedback loops, glassmorphism blur overlays, and customized HUD scanlines mimicking real-time eye-safe visor displays.

---

## 🏗️ Core Architecture & Features

The system is organized into a modular full-stack layout split across a reactive interface and backend pipelines:

### 1. Frontend Nexus Interface (`src/App.tsx`)
*   **Cinematic Memory Feed (`Vision` Tab)**: Real-time visual monitoring feed using local devices (camera & microphone, with user permission) to analyze sync coherence. Detects "loot/genetic fragments" in the current region and triggers sub-second localized extraction pathways.
*   **Synesthetic Canvas Cluster (`Nodes` Tab)**: High-performance HTML5 visualizer canvas powered by a custom mathematical renderer. Features variable BPM speed modulators (130-180 BPM), multiple phase patterns (**Neural Pulse**, **Cyber Grid**, **High Velocity Flow**), and chromatic tuning controls.
*   **Sonic Codex (`Codex` Tab)**: Explores deep progressive psytrance archetypes (e.g., *Zenith Void*, *Kinetic Occult*, *Chrono-Phantasm*) with curated track recommendations matching precise key signatures and tempos.
*   **Telemetry Log Terminal (`Chat` Tab)**: Real-time interactive terminal connected to Gemini, driving brief, analytical AI dialogues centered on sequencing memories and planning dark psychedelic progressions.
*   **Convergence Strategy Desk (`Aether` Tab)**: Displays high-level status readouts, Nephilim count tracking, and active status indicators for backend loop services.

### 2. Autonomous Choreography Engine
Piped continuously on startup, the **Galactus Loop** spins up a recurrent 30-minute background orchestration cycle:
*   **Galactus Orchestrator (`src/services/galactus-orchestrator.ts`)**: Initializes automatic failsafe steps, cycle sequences, and structural directives.
*   **Paralegal Service (`src/services/paralegal-service.ts`)**: Handles autonomous repository health checks, scanning lints, staging dependency upgrades, and managing PR creations.
*   **Jarvis Bridge (`src/services/jarvis-bridge.ts`)**: Serializes environment status reports and registers telemetry feedback safely.

### 3. SoundCloud Audio Ingestion Pipeline
Serves under `/api/audio/ingest` in the Express router (`/server/soundcloudRouter.ts`):
*   Exposes a **Human Sovereignty Gate** which actively blocks requests missing signed `APPROVED` credentials.
*   Queries Soundcloud's external APIs, resolving streamable audio schemas, BPM structures, and key signatures given track URLs.

### 4. Robust Security & Firebase Rule Integrity
*   Secured state documents configured in `firestore.rules` and indexed against invariants specified in `security_spec.md`.
*   Blocks identity spoofing, path variable compromises, system-only state variables contamination, and ghost-field overrides.

---

## ⚙️ Environment Configuration

Define the following environment variables in `.env.example` and supply them to your operational runtime (secrets are securely isolated server-side):

```env
# Gemini Intelligence Model Key
GEMINI_API_KEY=your_gemini_api_key_here

# SoundCloud API Integration Access Token
SOUNDCLOUD_ACCESS_TOKEN=your_soundcloud_oauth_token_here
```

---

## 🚀 Scripts & Local Execution

Configure your workspace environment and invoke the bundled build operations:

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Dev Server
Spins up the integrated Express + Vite dev server on port `3000` executing the entrypoint via `tsx`:
```bash
npm run dev
```

### 3. Compile Production Bundle
Compiles raw React assets via Vite and bundles the TypeScript backend server (`server.ts`) to a single, high-efficiency, cold-start optimized CommonJS file (`dist/server.cjs`):
```bash
npm run build
```

### 4. Run Production Server
Launches the standalone optimized backend:
```bash
npm run start
```

---

## 📂 File Directory

```
.
├── firebase-applet-config.json  # Dev Firebase Client Config
├── firebase-blueprint.json      # Remote Database Schema Config
├── firestore.rules               # Deployed Rule Invariants
├── security_spec.md              # Security Vulnerability Vectors
├── server.ts                     # Main Express Backend
├── server
│   └── soundcloudRouter.ts       # SoundCloud Resolution Pipeline
├── src
│   ├── App.tsx                   # Main Multi-Tab HUD UI Layout
│   ├── index.css                 # Inter & Mono Font Styling Definitions
│   ├── main.tsx                  # Main React Entrypoint
│   └── services
│       ├── galactus-loop.ts      # Main 30-Minute Maintenance Cycle
│       ├── galactus-orchestrator.ts # Core Orchestration Module
│       ├── jarvis-bridge.ts      # Telemetry Status Bridge
│       └── paralegal-service.ts  # Codebase Health & Self-Repair Module
├── vite.config.ts                # Hot-Reload Dev Configuration
└── README.md                     # Platform Documentation
```
