# 🚆 Trak — Dynamic Train ETA Forecast & Digital Twin

**Trak** is a high-performance, real-time Railway Corridor Digital Twin and Dynamic ETA Forecasting platform designed for high-density railway trunk corridors (such as the 435 KM Delhi–Kanpur Quad Trunk Line). It integrates automatic block signaling telemetry, dynamic headway separation monitoring, emergency interlocks, and timetable recovery slack subtraction to predict precise train arrival times and recommend real-time dispatching advisories.

---

## 🌟 Key Features

### 1. 📍 435 KM Corridor Digital Twin Schematic
- **Dual-Track Linear Topology**: Real-time visualization of UP Line (*NDLS ➔ CNB*) and DOWN Line (*CNB ➔ NDLS*) across major junction stations (*NDLS, GZB, ALJN, TDL, ETW, CNB*).
- **Block Signal Aspect Monitoring**: Visual telemetry for block states (**GREEN** Clear, **YELLOW** Caution, **DOUBLE_YELLOW** Advance Caution, **RED** Occupied/Fault).
- **Headway Distance Separation Bridges**: Live dynamic distance connectors (`↔ XX.X KM`) between consecutive trailing trains with automatic interlock alerts (*MIN DIST ENFORCED*, *CAUTION GAP*, *SAFE GAP*).
- **Animated Locomotive Telemetry**: Smooth position interpolation, speed indicator tags, delay badges, and station dwell indicators.

### 2. ⏱️ Dynamic ETA & Headway Recovery Engine
- **Timetable Slack Subtraction**: Subtracts available recovery slack buffer (0m – 20m) from raw delay metrics to present realistic net arrival predictions.
- **Priority-Based Dispatching**: Evaluates train hierarchy (Vande Bharat Express, Rajdhani Express, Express, Heavy Freight) to dynamically assign line authority.
- **Real-Time Headway Table**: Comprehensive live table tracking speed, delay breakdown, position, and operational status for all active corridor trains.

### 3. 🧪 Operational Scenario Simulator & AI Advisory
- **Preset Test Scenarios**:
  - **Nominal Clear Run**: All green aspects, nominal timetable operation.
  - **Heavy Freight Priority Override**: Slow freight train inserted ahead of high-priority coaching trains.
  - **Block Signal Failure (UP-BLK-03)**: Injects signal fault resulting in red aspect stop interlock and trailing train queueing.
  - **Temporary Speed Restriction (TSR)**: Enforces 30 km/h speed limit across TDL–ETW section due to track maintenance.
- **Simulation Control Controls**:
  - Speed Multipliers (**1x**, **2x**, **5x**, **10x**).
  - Live Pause / Resume execution.
  - Interactive Recovery Slack Buffer Slider (0 to 20 minutes).
- **Dynamic AI Advisory Engine**: Evaluates corridor states to offer one-click actionable dispatch instructions (e.g., freight loop siding hold, priority pass-through).

### 4. 🛠️ Interactive Block & Locomotive Inspector Modal
- **Telemetry Inspection**: Detailed readouts for any selected block, station, or locomotive.
- **Manual Fault Injection**: Toggle signal fault state on any block in real-time.
- **Locomotive Speed Override**: Manually adjust locomotive target speed for simulation stress testing.

### 5. 🔊 Web Audio API Telemetry Synthesizer
- Zero-dependency synthetic audio beacons for clicks, signal fault warnings, speed overrides, and scenario triggers.

### 6. ✨ Modern Dark UI & Cursor Glow Effect
- Dark void design system with glassmorphism backdrop blurs.
- Responsive, smooth cursor glow effect that brightens on movement and gracefully fades out during inactivity.

---

## 🏗️ Project Structure

```
Trak/
├── src/
│   ├── app/
│   │   ├── globals.css         # Dark theme design system, custom scrollbars & animations
│   │   ├── layout.tsx          # Root layout with metadata & dark mode
│   │   └── page.tsx            # Main dashboard container & live simulation loop
│   ├── components/
│   │   ├── Header.tsx          # Header bar with animated train SVG & IST clock
│   │   ├── CorridorSchematic.tsx # 435 KM linear track canvas & headway distance bridges
│   │   ├── HeadwayTable.tsx    # Dynamic ETA headway recovery table
│   │   ├── ScenarioSimulator.tsx # Operational scenario controls & AI advisory engine
│   │   ├── BlockInspectorModal.tsx # Telemetry inspector & manual override modal
│   │   └── CursorGlow.tsx      # Smooth cursor glow follower with idle decay
│   ├── lib/
│   │   ├── audio.ts            # Web Audio API beacon synthesizer
│   │   └── physics.ts          # Railway kinematics & signaling interlock simulation engine
│   └── types/
│       └── railway.ts          # TypeScript domain models (Train, Block, Station, Advisory)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/trak.git
   cd Trak
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev` — Launches Next.js development server.
- `npm run build` — Compiles production build with TypeScript checks.
- `npm run start` — Starts production server.
- `npm run lint` — Runs Next.js ESLint checks.

---

## 🛡️ License

Private & Proprietary — Developed for Railway Corridor Automation & ETA Forecasting.
