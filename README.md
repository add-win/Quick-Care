# 🏥 Quick-Care — AI-Driven Caregiver Workload Optimization Engine

Quick-Care is a full-stack real-time caregiver workload optimization engine designed to streamline elderly care, minimize response times, and prevent staff burnout. Powered by a custom **AI Scoring & Dispatching Engine** (with optional **Groq LLaMA 3** integration for explanations and shift handovers), it links administrators and on-duty caretakers through real-time WebSockets.

---

## ✨ Key Features

- 🖥️ **Dual-Portal System**:
  - **Dispatcher/Admin Dashboard**: High-level KPIs, live risk distribution, interactive caregiver mapping, and a manual assignment override.
  - **Caretaker Mobile Dashboard**: Caretaker-specific views with interactive checklists (Rounds, Feeding, Meds, Hygiene, Mobility) and instant alarm alerts.
- 📡 **Real-Time Synchronicity**: Live vital telemetry updates and emergency alarm dispatches via WebSockets.
- 🧠 **Dynamic AI Scoring Engine**: Scores caregivers from 0 to 100 based on complex factors (workload, proximity, status, skill-match, fairness, and ETA) to automatically route alarms to the best-suited caretaker.
- ⚖️ **Roster Rebalancing**: Algorithmic load balancing (`/rebalance`) that redistributes patients based on their current clinical intensity to avoid caregiver fatigue.
- 📑 **AI Shift Handover Reports**: Generates professional shift handover reports summarizing critical patient events and workload recommendations using LLaMA 3.
- 🎨 **Modern Dark-Mode Aesthetics**: Premium CSS implementation featuring responsive layouts, hover animations, glassmorphism, and live charts.

---

## 📁 Folder Structure

```
Quick-Care/
├── backend/
│   ├── main.py               ← FastAPI backend (API, scoring, websockets & simulator)
│   └── requirements.txt      ← Python dependencies
│
└── frontend/
    ├── package.json          ← Node/React configuration
    ├── public/
    │   ├── LOGOlight.png     ← Light theme logo
    │   ├── LOGOdark.png      ← Dark theme logo
    │   └── index.html        ← Root HTML shell
    └── src/
        ├── index.js          ← React entry point
        ├── index.css         ← Global design system, colors & variables
        ├── App.js            ← Main router, shell state & WebSocket listener
        ├── api.js            ← Centralized Axios-free API client & helpers
        ├── components/
        │   ├── UI.jsx        ← Shared UI design library (Card, Badge, Button, etc.)
        │   └── AssignModal.jsx ← Interactive AI assignment scoring modal
        └── pages/
            ├── Login.jsx              ← Landing page with dual role logins
            ├── Overview.jsx           ← Main admin KPI dashboard and active alerts
            ├── Caregivers.jsx         ← Caregiver cards & patients drill-down list
            ├── Patients.jsx           ← Roster table with sorting, filtering & rebalance
            ├── Alarms.jsx             ← Historical & active alarm log with simulation trigger
            ├── Analytics.jsx          ← Recharts charts & AI Shift Handover compiler
            └── CaretakerDashboard.jsx ← Dedicated caretaker workspace with checklist tasks
```

---

## 🚀 Setup & Installation (Under 5 Minutes)

### Prerequisites
- Python 3.8+ installed
- Node.js (v18+) & npm installed

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell/CMD)
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. *(Optional)* Set up your **Groq API Key** for LLM explanations and reports (Get a free key [here](https://console.groq.com/keys)):
   ```bash
   # Windows PowerShell
   $env:GROQ_API_KEY="your_api_key_here"

   # Windows CMD
   set GROQ_API_KEY=your_api_key_here

   # macOS/Linux
   export GROQ_API_KEY="your_api_key_here"
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - *API runs at:* `http://localhost:8000`
   - *Swagger Docs:* `http://localhost:8000/docs`

### 2. Frontend Setup
1. Open a new terminal window at the project root and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   - *App runs at:* `http://localhost:3000`

---

## 🔑 Credentials for Testing

| Portal | Email / Username | Password | Notes |
|---|---|---|---|
| **Admin / Dispatcher** | `admin@gmail.com` | `admin` | Full control and analytics |
| **Caretaker (Maria)** | `maria@gmail.com` | `maria` | Senior Nurse, Floor 1 (Cardiac/Dementia skills) |
| **Caretaker (James)** | `james@gmail.com` | `james` | Nurse, Floor 1 (Diabetes/Mobility skills) |
| **Caretaker (Priya)** | `priya@gmail.com` | `priya` | Caregiver, Floor 2 (Respiratory skills) |
| **Caretaker (Tom)** | `tom@gmail.com` | `tom` | Caregiver, Floor 2 (Mobility/Fall skills) |
| **Caretaker (Lisa)** | `lisa@gmail.com` | `lisa` | Nurse, Floor 3 (Cardiac/Respiratory skills) |
| **Caretaker (Sam)** | `sam@gmail.com` | `sam` | Caregiver, Floor 3 (Dementia/Wandering skills) |

---

## 🧠 Smart AI Routing & Scoring

Quick-Care scores potential caregivers for incoming emergency alarms on a **100-point scale** according to the following weights:

$$Score = (0.25 \times Workload) + (0.20 \times Proximity) + (0.20 \times Status) + (0.15 \times Skills) + (0.10 \times Fairness) + (0.10 \times ETA)$$

### Scoring Factors:
- **Workload (25%)**: Prioritizes caregivers with lower workloads to prevent burnout.
- **Proximity (20%)**: Caregivers on the same floor get 100 pts, adjacent floor 55 pts, other floors 20 pts.
- **Status (20%)**: `available` (100), `attending` (50), `on_rounds` (40), `on_break` (10), `out_of_premises` (0).
- **Skill Match (15%)**: Assesses specialty match for the alarm type (e.g. cardiac, fall) with a role bonus (Senior Nurse +15, Nurse +8).
- **Fairness (10%)**: Leverages caregiver historical rotation stats to distribute alerts equitably.
- **ETA (10%)**: Estimations based on caregiver travel times (100 - `eta` × 5).

### Penalties:
- **0.30x Multiplier** if a critical alarm is triggered while a caretaker is on break or off premises.
- **0.60x Multiplier** if a caregiver is currently responding to 3+ active alarms.
- **0.85x Multiplier** if a caregiver has 10+ patients on their panel.

---

## 🌐 API & WebSockets

### REST Routes
- `GET /stats`: Aggregates active dashboard KPIs.
- `GET /caregivers`: Lists all caregivers and their current operational state.
- `PUT /caregivers/{cid}/status`: Updates a caregiver's status.
- `GET /patients`: Fetches all patients and their current vitals/risk scores.
- `POST /rebalance`: Algorithmic load balancing of the patient panel.
- `GET /alarms/active`: Returns all unacknowledged emergency alerts.
- `POST /alarms/{aid}/ack`: Administrator manual override to acknowledge alarms.
- `POST /alarms/{aid}/caretaker-ack`: Caretaker device confirmation to resolve alerts.
- `POST /assign`: Returns ranked caregivers list and LLM rationale.
- `GET /analytics/report`: Calls Groq to generate a professional shift handover draft.

### Live feed
- `WS /ws`: Sustains bidirectional connections for pushing vitals and dispatcher/caretaker alert payloads.

---

## 🎯 Steps to Demo

1. **Roster Rebalancing**: Log in as Admin. Navigate to **Patients** tab. Click **Auto Rebalance Patients** to see assignments distributed optimally based on patient intensity.
2. **Real-time Vitals & Critical Alarms**:
   - The vitals simulator runs in the background. If a patient's vitals drift outside normal ranges, an alarm will trigger automatically.
   - You can also manually trigger one on the **Alarms** tab (e.g., click "Trigger cardiac alarm" for a patient).
3. **AI Caregiver Selection**:
   - Click **Assign Caregiver** on a pending alarm in the Overview tab.
   - The Dispatch Modal will display caregiver scores, matching breakdowns, and the AI's natural language reasoning for the recommendation.
   - Click **Confirm Assignment** to route it.
4. **Caretaker Notification**:
   - Open a private browsing window and log in as the assigned caretaker (e.g., Maria).
   - Watch the alarm alert pop up instantly on Maria's caretaker portal.
   - Complete tasks in the checklists and click **Acknowledge** to clear the alarm.
5. **Analytics and AI Report**:
   - Go to the **Analytics** tab. Review the workload/fairness chart and risk distribution.
   - Click **Generate Shift Report** to fetch the LLaMA 3 generated handover documentation.
