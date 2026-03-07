# 🏥 QCare — AI Caregiver Workload Optimization Engine

> Full-stack hackathon project | FastAPI backend + React frontend | 40 patients · 6 caregivers | Free AI via Groq

---

## 📁 Folder Structure

```
careoptimize/
│
├── backend/
│   ├── main.py               ← Single FastAPI file (all logic combined)
│   └── requirements.txt
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js           ← React entry
        ├── App.js             ← Shell + sidebar + routing + WS
        ├── api.js             ← All API calls + helpers
        ├── components/
        │   ├── UI.jsx         ← Design system (Card, Badge, WBar, Btn...)
        │   └── AssignModal.jsx← AI assignment modal with score rings
        └── pages/
            ├── Overview.jsx   ← KPI strip + workload + active alarms
            ├── Caregivers.jsx ← Caregiver cards + patient drill-down
            ├── Patients.jsx   ← Filterable patient table
            ├── Alarms.jsx     ← Active alarms + history + manual trigger
            └── Analytics.jsx  ← Bar/Radar charts + AI shift report
```

---

## 🚀 Setup (5 minutes)

### 1. Backend

```bash
cd careoptimize/backend
pip install -r requirements.txt

# Optional — get FREE Groq key at https://console.groq.com/keys
export GROQ_API_KEY=your_key_here   # enables LLM explanations

uvicorn main:app --reload --port 8000
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd careoptimize/frontend
npm install
npm start
# → App running at http://localhost:3000
```

---

## 🔑 Free APIs

| Service | Use | How to get |
|---------|-----|-----------|
| **Groq** | LLaMA 3 explanations + shift reports | Free at [console.groq.com](https://console.groq.com) |
| Works without any API key — falls back to rule-based logic | | |

---

## 🧠 Team Division (6 members)

| Member | Owns |
|--------|------|
| M1 | `backend/main.py` — models, seed data, REST routes |
| M2 | `backend/main.py` — `_score()` / `_explain()` scoring engine |
| M3 | `frontend/src/App.js` + `components/UI.jsx` |
| M4 | `frontend/src/pages/Overview.jsx` + `Patients.jsx` |
| M5 | `frontend/src/components/AssignModal.jsx` + `Alarms.jsx` |
| M6 | `frontend/src/pages/Analytics.jsx` + `backend/main.py` analytics routes |

---

## 🌐 Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Dashboard summary |
| GET | `/caregivers` | All 6 caregivers |
| GET | `/patients` | All 40 patients |
| GET | `/patients/top-risk?n=10` | Highest risk patients |
| POST | `/rebalance` | Auto-rebalance patient assignments |
| GET | `/alarms` | Alarm history |
| GET | `/alarms/active` | Unacknowledged alarms |
| POST | `/alarms/{id}/ack` | Acknowledge alarm |
| POST | `/assign` | **Run AI caregiver assignment** |
| GET | `/assignments` | Assignment audit trail |
| GET | `/analytics/workload` | Workload per caregiver |
| GET | `/analytics/risk-distribution` | Patient risk breakdown |
| GET | `/analytics/report` | AI-generated shift report |
| WS  | `/ws` | Live vital updates + alarm events |

---

## 🎯 Demo Walkthrough (for judges)

1. **Overview** — See 6 KPI cards, live workload bars, active alarms, top-risk patients
2. **Caregivers** — Click any caregiver card to see their patient panel sorted by risk
3. **Patients** — Filter by disease, sort by risk, trigger manual assignment
4. **Alarms tab** → Click "Trigger cardiac alarm" → AI Assignment Modal opens
5. **Modal** — Watch 6 caregivers get scored (workload/proximity/skill/fairness/ETA)
6. **Score rings** show Primary / Secondary / Backup with breakdown per factor
7. **Analytics** → Radar chart, bar charts, fairness bars
8. **"Generate AI Shift Report"** → Groq LLaMA writes a handover summary

---

## ⚡ Scoring Algorithm

```
Score = 0.25 × workload_score     (lower load = better)
      + 0.20 × proximity_score    (same floor = 100pts)
      + 0.20 × status_score       (available=100, break=10, away=0)
      + 0.15 × skill_match_score  (specialization overlap)
      + 0.10 × fairness_score     (avoid burnout)
      + 0.10 × eta_score          (100 - eta_minutes*5)

Penalties:
  × 0.30  if critical alarm + caregiver on break/away
  × 0.60  if caregiver already handling 3+ alarms
  × 0.85  if caregiver has 10+ patients
```
