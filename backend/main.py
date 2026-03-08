"""
CareOptimize — Backend Entry Point
Combines all services: core data, AI engine, patient vitals, alerts, analytics
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
import uuid, random, json, asyncio, os
from datetime import datetime, timedelta

# ── Optional Groq (free LLM) ───────────────────────────────────────────────
try:
    from groq import Groq
    _groq = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
    GROQ_OK = bool(os.environ.get("GROQ_API_KEY"))
except Exception:
    GROQ_OK = False

app = FastAPI(title="CareOptimize API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ══════════════════════════════════════════════════════════════════════════════
# ENUMS & MODELS
# ══════════════════════════════════════════════════════════════════════════════

class Status(str, Enum):
    AVAILABLE = "available"; ATTENDING = "attending"; ON_ROUNDS = "on_rounds"
    ON_BREAK  = "on_break";  OUT       = "out_of_premises"

class Severity(str, Enum):
    INFO = "info"; WARNING = "warning"; CRITICAL = "critical"

class AlarmType(str, Enum):
    CARDIAC = "cardiac"; FALL = "fall"; WANDERING = "wandering"
    SPO2    = "spo2";    BP   = "blood_pressure"; HRV = "hrv"

class Disease(str, Enum):
    CARDIAC     = "cardiac";    DEMENTIA    = "dementia"
    DIABETES    = "diabetes";   RESPIRATORY = "respiratory"
    MOBILITY    = "mobility";   GENERAL     = "general"

class Vitals(BaseModel):
    heart_rate: float = 72; spo2: float = 98.0
    bp_sys: float = 120;    bp_dia: float = 80
    temperature: float = 98.6; hrv: float = 45.0
    updated: str = Field(default_factory=lambda: datetime.now().isoformat())

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str; age: int; room: str; floor: int
    disease: Disease; intensity: int   # 1-10
    caregiver_id: Optional[str] = None
    vitals: Vitals = Field(default_factory=Vitals)
    risk: float = 0.0; notes: str = ""

class Caregiver(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str; role: str; floor: int
    status: Status = Status.AVAILABLE
    patients: List[str] = []
    alarms: int = 0; tasks: int = 0
    workload: float = 0.0; fairness: float = 100.0
    daily_assignments: int = 0; eta: int = 0
    skills: List[str] = []

class AlarmEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    patient_id: str; patient_name: str; room: str; floor: int
    type: AlarmType; severity: Severity
    value: float; threshold: float
    ts: str = Field(default_factory=lambda: datetime.now().isoformat())
    acked: bool = False; ack_by: Optional[str] = None
    primary_cg_id: Optional[str] = None; secondary_cg_id: Optional[str] = None; tertiary_cg_id: Optional[str] = None
    primary_cg_name: Optional[str] = None; secondary_cg_name: Optional[str] = None; tertiary_cg_name: Optional[str] = None
    primary_acked: bool = False; secondary_acked: bool = False; tertiary_acked: bool = False
    primary_ack_time: Optional[str] = None; secondary_ack_time: Optional[str] = None; tertiary_ack_time: Optional[str] = None

class AssignRequest(BaseModel):
    patient_id: str; alarm_type: str; severity: str

# ══════════════════════════════════════════════════════════════════════════════
# DATA STORE
# ══════════════════════════════════════════════════════════════════════════════

STORE: Dict = {"patients": {}, "caregivers": {}, "alarms": [], "assignments": [], "alarm_stats": {"total": 0, "critical": 0, "acked": 0}}
WS_CLIENTS: Dict = {}  # Format: {ws: {"caretaker_email": str, "caretaker_id": str}}

# ─── Seed ────────────────────────────────────────────────────────────────────
_NAMES = ["Mary Smith","John Jones","Alice Brown","Bob Davis","Carol Wilson","David Moore",
          "Emma Taylor","Frank Anderson","Grace Thomas","Henry Jackson","Irene White","James Harris",
          "Karen Martin","Leo Garcia","Mabel Smith","Nathan Jones","Olive Brown","Paul Davis",
          "Queen Wilson","Robert Moore","Sarah Taylor","Thomas Anderson","Uma Thomas","Victor Jackson",
          "Wendy White","Xavier Harris","Yolanda Martin","Zach Garcia","Ann Smith","Ben Jones",
          "Clara Brown","Dan Davis","Eva Wilson","Fred Moore","Gina Taylor","Hugh Anderson",
          "Iris Thomas","Jake Jackson","Kira White","Louis Harris"]

_CG_RAW = [
    {"name":"Maria John",  "email":"maria@gmail.com", "role":"senior_nurse","floor":1,"skills":["cardiac","dementia"]},
    {"name":"James Lee",   "email":"james@gmail.com", "role":"nurse",       "floor":1,"skills":["diabetes","mobility"]},
    {"name":"Priya Mehta", "email":"priya@gmail.com", "role":"caregiver",   "floor":2,"skills":["respiratory"]},
    {"name":"Tom Walsh",   "email":"tom@gmail.com", "role":"caregiver",   "floor":2,"skills":["mobility","fall"]},
    {"name":"Lisa Chen",   "email":"lisa@gmail.com", "role":"nurse",       "floor":3,"skills":["cardiac","respiratory"]},
    {"name":"Sam Okafor",  "email":"sam@gmail.com", "role":"caregiver",   "floor":3,"skills":["dementia","wandering"]},
]

CAREGIVER_EMAIL_MAP = {}  # Maps email to caregiver_id

def _seed():
    global CAREGIVER_EMAIL_MAP
    cg_ids = []
    for raw in _CG_RAW:
        c = Caregiver(name=raw["name"], role=raw["role"], floor=raw["floor"], skills=raw["skills"],
                      workload=round(random.uniform(10,45),1), alarms=random.randint(0,2),
                      tasks=random.randint(1,5), daily_assignments=random.randint(2,7),
                      eta=random.randint(0,15),
                      status=random.choice([Status.AVAILABLE, Status.ATTENDING, Status.ON_ROUNDS]))
        STORE["caregivers"][c.id] = c
        CAREGIVER_EMAIL_MAP[raw["email"]] = c.id  # Map email to caregiver ID
        cg_ids.append(c.id)

    diseases = list(Disease)
    for i, name in enumerate(_NAMES):
        fl = (i // 15) + 1
        dis = diseases[i % 6]; inten = 1 + (i % 10)
        assigned = cg_ids[i % 6]
        p = Patient(name=name, age=65+(i%31), room=f"{fl}{str(i%15+1).zfill(2)}",
                    floor=fl, disease=dis, intensity=inten, caregiver_id=assigned,
                    vitals=Vitals(heart_rate=random.randint(60,105),
                                  spo2=round(random.uniform(93,99),1),
                                  bp_sys=random.randint(110,155)),
                    risk=round(inten*8 + random.uniform(0,10), 1))
        STORE["patients"][p.id] = p
        STORE["caregivers"][assigned].patients.append(p.id)

_seed()

# ══════════════════════════════════════════════════════════════════════════════
# AI SCORING ENGINE
# ══════════════════════════════════════════════════════════════════════════════

_WEIGHTS = {"workload": 0.25, "proximity": 0.20, "status": 0.20,
            "skill": 0.15, "fairness": 0.10, "eta": 0.10}
_STATUS_SCORE = {"available":1.0,"attending":0.5,"on_rounds":0.4,"on_break":0.1,"out_of_premises":0.0}
_SKILL_MAP = {"cardiac":["cardiac","senior_nurse"],"fall":["mobility","fall"],
              "wandering":["dementia","wandering"],"spo2":["respiratory","nurse"],
              "blood_pressure":["cardiac","nurse"],"hrv":["cardiac","senior_nurse"]}
_ROLE_BONUS = {"senior_nurse":15,"nurse":8,"caregiver":0}

def _score(cg: Caregiver, patient_floor: int, alarm_type: str, severity: str) -> Dict:
    bd = {}
    bd["workload"]  = round((1 - min(cg.workload,100)/100)*100, 1)
    diff = abs(cg.floor - patient_floor)
    bd["proximity"] = 100 if diff==0 else 55 if diff==1 else 20
    bd["status"]    = round(_STATUS_SCORE.get(cg.status.value, 0)*100, 1)
    req = _SKILL_MAP.get(alarm_type, [])
    sm  = (sum(1 for s in cg.skills if s in req)/len(req)*100) if req else 50
    bd["skill"]     = min(100, round(sm + _ROLE_BONUS.get(cg.role,0), 1))
    bd["fairness"]  = min(100, round(cg.fairness, 1))
    bd["eta"]       = max(0, round(100 - cg.eta*5, 1))
    total = sum(_WEIGHTS[k]*bd[k] for k in _WEIGHTS)
    if severity=="critical" and cg.status.value in ("on_break","out_of_premises"): total *= 0.3
    if cg.alarms >= 3: total *= 0.6
    if len(cg.patients) >= 10: total *= 0.85
    return {"id":cg.id,"name":cg.name,"role":cg.role,"floor":cg.floor,
            "status":cg.status.value,"score":round(total,1),"breakdown":bd,"eta":cg.eta}

def _explain(ranked, patient_name, floor, alarm_type, severity):
    top = ranked[0]
    bd  = top["breakdown"]
    if GROQ_OK:
        try:
            prompt = (f"Elderly care AI. Explain in 2 sentences why {top['name']} (score {top['score']}%) "
                      f"is best for a {severity} {alarm_type} alarm for {patient_name} on floor {floor}. "
                      f"Breakdown: {json.dumps(bd)}. Be clinical and concise.")
            r = _groq.chat.completions.create(model="llama3-8b-8192",
                messages=[{"role":"user","content":prompt}], max_tokens=120, temperature=0.3)
            return r.choices[0].message.content.strip()
        except: pass
    # Fallback
    reasons = []
    if bd.get("workload",0)>65: reasons.append("low workload")
    if bd.get("proximity",0)>=100: reasons.append("same floor")
    if bd.get("skill",0)>70: reasons.append(f"{alarm_type} specialization")
    if top["status"]=="available": reasons.append("immediately available")
    if bd.get("fairness",0)>80: reasons.append("fair rotation")
    return f"{top['name']} recommended ({top['score']:.0f}% match) — {'; '.join(reasons) or 'highest composite score'}."

# ══════════════════════════════════════════════════════════════════════════════
# VITAL SIMULATOR (background task)
# ══════════════════════════════════════════════════════════════════════════════

THRESHOLDS = {"heart_rate":{"high":120,"crit":140},"spo2":{"low":92,"crit":88},"bp_sys":{"high":160,"crit":180}}

def _drift(v, mean, sigma, lo, hi):
    nv = v + random.gauss(0,sigma)*0.3 + (mean-v)*0.02
    return max(lo, min(hi, round(nv, 1)))

def _tick_vitals():
    new_alarms = []
    for p in STORE["patients"].values():
        v = p.vitals
        v.heart_rate  = _drift(v.heart_rate, 72, 6, 45, 155)
        v.spo2        = _drift(v.spo2, 97, 0.4, 84, 100)
        v.bp_sys      = _drift(v.bp_sys, 125, 5, 85, 195)
        v.temperature = _drift(v.temperature, 98.6, 0.15, 95, 104)
        v.hrv         = _drift(v.hrv, 45, 2, 10, 80)
        v.updated     = datetime.now().isoformat()
        # Disease amplification
        if p.disease.value=="cardiac" and random.random()<0.04:
            v.heart_rate = max(40, min(160, v.heart_rate + random.choice([-18,22,28])))
        if p.disease.value=="respiratory" and random.random()<0.035:
            v.spo2 = max(84, v.spo2 - random.uniform(2,5))
        # Risk
        base = p.intensity*8.0
        if v.heart_rate>120: base+=12
        if v.spo2<88: base+=25
        elif v.spo2<92: base+=15
        if v.bp_sys>180: base+=20
        p.risk = min(100, round(base, 1))
        # Check alarms
        alm = None
        if v.heart_rate>THRESHOLDS["heart_rate"]["crit"]:
            alm = AlarmEvent(patient_id=p.id, patient_name=p.name, room=p.room, floor=p.floor,
                             type=AlarmType.CARDIAC, severity=Severity.CRITICAL,
                             value=v.heart_rate, threshold=THRESHOLDS["heart_rate"]["crit"])
        elif v.spo2<THRESHOLDS["spo2"]["crit"]:
            alm = AlarmEvent(patient_id=p.id, patient_name=p.name, room=p.room, floor=p.floor,
                             type=AlarmType.SPO2, severity=Severity.CRITICAL,
                             value=v.spo2, threshold=THRESHOLDS["spo2"]["crit"])
        elif v.heart_rate>THRESHOLDS["heart_rate"]["high"]:
            alm = AlarmEvent(patient_id=p.id, patient_name=p.name, room=p.room, floor=p.floor,
                             type=AlarmType.CARDIAC, severity=Severity.WARNING,
                             value=v.heart_rate, threshold=THRESHOLDS["heart_rate"]["high"])
        if alm:
            # Deduplicate: skip if same patient+type alarm in last 3 min
            recent = [a for a in STORE["alarms"][-30:] if a.patient_id==p.id and a.type==alm.type]
            if not recent or (datetime.now()-datetime.fromisoformat(recent[-1].ts)).seconds > 180:
                # Auto-assign to top 3 best caretakers
                scores = [(_score(cg, p.floor, alm.type.value, alm.severity.value), cg) for cg in STORE["caregivers"].values()]
                scores.sort(key=lambda x: x[0].get("score", 0), reverse=True)
                top_3 = [s[1] for s in scores[:3]]
                
                if len(top_3) > 0: alm.primary_cg_id = top_3[0].id; alm.primary_cg_name = top_3[0].name
                if len(top_3) > 1: alm.secondary_cg_id = top_3[1].id; alm.secondary_cg_name = top_3[1].name
                if len(top_3) > 2: alm.tertiary_cg_id = top_3[2].id; alm.tertiary_cg_name = top_3[2].name
                
                STORE["alarms"].append(alm); STORE["alarm_stats"]["total"]+=1
                if alm.severity==Severity.CRITICAL: STORE["alarm_stats"]["critical"]+=1
                new_alarms.append(alm)
                print(f"🚨 NEW ALARM: {alm.id} - {p.name} ({alm.type}) assigned to: {alm.primary_cg_name}/{alm.primary_cg_id}")
    if new_alarms:
        print(f"📤 Returning {len(new_alarms)} alarms from _tick_vitals")
    return new_alarms

async def broadcast_alarms(new_alarms):
    if not new_alarms or not WS_CLIENTS: return
    print(f"📢 Broadcasting {len(new_alarms)} new alarms to {len(WS_CLIENTS)} clients")
    dead=[]
    for ws, client_info in list(WS_CLIENTS.items()):
        try:
            role = client_info.get("role")
            if role == "admin":
                msg = json.dumps({
                    "type": "vitals_update",
                    "new_alarms": [a.dict() for a in new_alarms],
                    "ts": datetime.now().isoformat()
                })
                await ws.send_text(msg)
                
            for alm in new_alarms:
                # Send ONLY to primary caretaker
                cg_id = client_info.get("caretaker_id")
                real_cg_id = CAREGIVER_EMAIL_MAP.get(cg_id, cg_id) if cg_id else None
                if real_cg_id == alm.primary_cg_id:
                    msg = json.dumps({
                        "type": "caretaker_alert",
                        "alarm": alm.dict(),
                        "priority": "primary",
                        "ts": datetime.now().isoformat()
                    })
                    await ws.send_text(msg)
        except Exception as e:
            print(f"   ! Error: {e}")
            dead.append(ws)
    for d in dead:
        if d in WS_CLIENTS:
            del WS_CLIENTS[d]

async def broadcast_alarm_update(alm: AlarmEvent):
    if not WS_CLIENTS: return
    dead = []
    for ws, client_info in list(WS_CLIENTS.items()):
        try:
            role = client_info.get("role")
            if role == "admin":
                # Send an alarm_update so admin UI updates the ack status
                msg = json.dumps({
                    "type": "alarm_update",
                    "alarm": alm.dict(),
                    "ts": datetime.now().isoformat()
                })
                await ws.send_text(msg)
            else:
                cg_id = client_info.get("caretaker_id")
                real_cg_id = CAREGIVER_EMAIL_MAP.get(cg_id, cg_id) if cg_id else None
                # If this caregiver is a backup and primary acked, cancel their alert!
                if alm.acked and real_cg_id in [alm.secondary_cg_id, alm.tertiary_cg_id]:
                    msg = json.dumps({
                        "type": "cancel_alert",
                        "alarm_id": alm.id
                    })
                    await ws.send_text(msg)
        except Exception as e:
            dead.append(ws)
    for d in dead:
        if d in WS_CLIENTS: del WS_CLIENTS[d]

@app.on_event("startup")
async def start_simulator():
    async def _loop():
        while True:
            await asyncio.sleep(6)
            new_alarms = _tick_vitals()
            await broadcast_alarms(new_alarms)
    asyncio.create_task(_loop())

# ══════════════════════════════════════════════════════════════════════════════
# REST ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root(): return {"status":"ok","patients":len(STORE["patients"]),"caregivers":len(STORE["caregivers"])}

# ── Caregivers ────────────────────────────────────────────────────────────────
@app.get("/caregivers")
def get_caregivers(): return list(STORE["caregivers"].values())

@app.put("/caregivers/{cid}/status")
def set_status(cid:str, status:Status):
    if cid not in STORE["caregivers"]: raise HTTPException(404)
    STORE["caregivers"][cid].status = status; return {"ok":True}

# ── Patients ──────────────────────────────────────────────────────────────────
@app.get("/patients")
def get_patients(): return list(STORE["patients"].values())

@app.get("/patients/caregiver/{cid}")
def patients_by_cg(cid:str):
    return [p for p in STORE["patients"].values() if p.caregiver_id==cid]

@app.get("/patients/top-risk")
def top_risk(n:int=10):
    pts = sorted(STORE["patients"].values(), key=lambda p:p.risk, reverse=True)
    return pts[:n]

@app.post("/rebalance")
def rebalance():
    cg_ids = list(STORE["caregivers"].keys())
    pts = sorted(STORE["patients"].values(), key=lambda p:p.risk, reverse=True)
    load = {c:0.0 for c in cg_ids}
    for cg in STORE["caregivers"].values(): cg.patients=[]
    for p in pts:
        best = min(load, key=load.get)
        p.caregiver_id = best; load[best]+=p.intensity
        STORE["caregivers"][best].patients.append(p.id)
    return {"ok":True,"loads":load}

# ── Alarms ────────────────────────────────────────────────────────────────────
@app.get("/alarms")
def get_alarms(limit:int=40):
    return list(reversed(STORE["alarms"]))[:limit]

@app.get("/alarms/active")
def active_alarms():
    return [a for a in STORE["alarms"] if not a.acked]

@app.post("/alarms/{aid}/ack")
def ack_alarm(aid:str, cg_id:str=""):
    real_cg_id = CAREGIVER_EMAIL_MAP.get(cg_id, cg_id)
    for a in STORE["alarms"]:
        if a.id==aid: a.acked=True; a.ack_by=real_cg_id; STORE["alarm_stats"]["acked"]+=1; return {"ok":True}
    raise HTTPException(404)

@app.post("/alarms/{aid}/caretaker-ack")
async def caretaker_ack_alarm(aid:str, cg_id:str=""):
    """Caretaker acknowledges receiving the alert"""
    real_cg_id = CAREGIVER_EMAIL_MAP.get(cg_id, cg_id)
    for a in STORE["alarms"]:
        if a.id == aid:
            is_primary = (a.primary_cg_id == real_cg_id)
            if a.primary_cg_id == real_cg_id:
                a.primary_acked = True
                a.primary_ack_time = datetime.now().isoformat()
            elif a.secondary_cg_id == real_cg_id:
                a.secondary_acked = True
                a.secondary_ack_time = datetime.now().isoformat()
            elif a.tertiary_cg_id == real_cg_id:
                a.tertiary_acked = True
                a.tertiary_ack_time = datetime.now().isoformat()
                
            if is_primary and not a.acked:
                a.acked = True
                a.ack_by = real_cg_id
                STORE["alarm_stats"]["acked"]+=1
                await broadcast_alarm_update(a)
                
            return {"ok": True, "acknowledged": True}
    raise HTTPException(404)

# ── AI Assignment ─────────────────────────────────────────────────────────────
@app.post("/assign")
def assign(req: AssignRequest):
    p = STORE["patients"].get(req.patient_id)
    if not p: raise HTTPException(404, "Patient not found")
    cgs = list(STORE["caregivers"].values())
    ranked = sorted([_score(c, p.floor, req.alarm_type, req.severity) for c in cgs],
                    key=lambda x:x["score"], reverse=True)
    explanation = _explain(ranked, p.name, p.floor, req.alarm_type, req.severity)
    result = {"patient_id": req.patient_id, "patient":p.name,"room":p.room,"alarm_type":req.alarm_type,"severity":req.severity,
              "primary":ranked[0],"secondary":ranked[1],"backup":ranked[2],
              "explanation":explanation,"all":ranked,"ts":datetime.now().isoformat()}
    return result

class ConfirmAssignRequest(BaseModel):
    result: dict

@app.post("/confirm_assignment")
async def confirm_assignment(req: ConfirmAssignRequest):
    r = req.result
    # Create the AlarmEvent
    alm = AlarmEvent(
        patient_id=r["patient_id"], patient_name=r["patient"], room=r["room"], floor=1,
        type=AlarmType(r["alarm_type"]), severity=Severity(r["severity"]),
        value=0, threshold=0,
        primary_cg_id=r["primary"]["id"], primary_cg_name=r["primary"]["name"],
        secondary_cg_id=r["secondary"]["id"], secondary_cg_name=r["secondary"]["name"],
        tertiary_cg_id=r["backup"]["id"], tertiary_cg_name=r["backup"]["name"]
    )
    p = STORE["patients"].get(r["patient_id"])
    if p: alm.floor = p.floor
    
    STORE["alarms"].append(alm)
    STORE["alarm_stats"]["total"] += 1
    if alm.severity == Severity.CRITICAL: STORE["alarm_stats"]["critical"] += 1
    
    STORE["assignments"].append(r)
    
    # Update caregiver
    cid = r["primary"]["id"]
    if cid in STORE["caregivers"]:
        STORE["caregivers"][cid].daily_assignments += 1
        STORE["caregivers"][cid].alarms += 1
        STORE["caregivers"][cid].fairness = max(0, STORE["caregivers"][cid].fairness - 5)
        STORE["caregivers"][cid].workload = min(100, STORE["caregivers"][cid].workload + 8)
    
    # Broadcast immediately
    await broadcast_alarms([alm])
    return {"ok": True}

@app.get("/assignments")
def get_assignments(limit:int=20):
    return list(reversed(STORE["assignments"]))[:limit]

# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/stats")
def stats():
    pts = list(STORE["patients"].values()); cgs = list(STORE["caregivers"].values())
    return {"total_patients":len(pts),"total_caregivers":len(cgs),
            "critical":sum(1 for p in pts if p.risk>=70),
            "warning":sum(1 for p in pts if 40<=p.risk<70),
            "stable":sum(1 for p in pts if p.risk<40),
            "available_cgs":sum(1 for c in cgs if c.status==Status.AVAILABLE),
            "active_alarms":sum(1 for a in STORE["alarms"] if not a.acked),
            "alarm_stats":STORE["alarm_stats"],
            "avg_workload":round(sum(c.workload for c in cgs)/len(cgs),1)}

# ── Analytics ─────────────────────────────────────────────────────────────────
@app.get("/analytics/workload")
def analytics_workload():
    cgs = list(STORE["caregivers"].values())
    return [{"name":c.name,"workload":c.workload,"fairness":c.fairness,
             "alarms":c.alarms,"patients":len(c.patients),"role":c.role} for c in cgs]

@app.get("/analytics/risk-distribution")
def risk_dist():
    pts = list(STORE["patients"].values())
    return {"critical":sum(1 for p in pts if p.risk>=70),
            "high":sum(1 for p in pts if 55<=p.risk<70),
            "medium":sum(1 for p in pts if 40<=p.risk<55),
            "low":sum(1 for p in pts if p.risk<40)}

@app.get("/analytics/report")
def shift_report():
    cgs = list(STORE["caregivers"].values())
    pts = list(STORE["patients"].values())
    alms = STORE["alarms"]; stats_ = STORE["alarm_stats"]
    most = max(cgs, key=lambda c:c.workload)
    least = min(cgs, key=lambda c:c.workload)
    if GROQ_OK:
        try:
            info = {"caregivers":[{"name":c.name,"role":c.role,"patients":len(c.patients),
                                    "workload":round(c.workload,1),"alarms":c.alarms,
                                    "fairness":round(c.fairness,1)} for c in cgs],
                    "total_alarms":stats_["total"],"critical":stats_["critical"],
                    "acked":stats_["acked"],"total_patients":len(pts)}
            prompt = (f"Generate a 300-word professional shift handover report for elderly care staff. "
                      f"Data: {json.dumps(info)}. Include: Overview, Top Performers, Concerns, Recommendations.")
            r = _groq.chat.completions.create(model="llama3-8b-8192",
                messages=[{"role":"user","content":prompt}], max_tokens=500, temperature=0.3)
            return {"report":r.choices[0].message.content.strip(),"ai":True}
        except: pass
    report = (f"SHIFT SUMMARY — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
              f"Patients: {len(pts)} | Caregivers: {len(cgs)}\n"
              f"Alarms: {stats_['total']} total, {stats_['critical']} critical, {stats_['acked']} acknowledged\n\n"
              f"Most loaded: {most.name} ({most.workload:.0f}%)\n"
              f"Least loaded: {least.name} ({least.workload:.0f}%)\n\n"
              + "\n".join(f"• {c.name}: {len(c.patients)} patients, {c.alarms} alarms, workload {c.workload:.0f}%" for c in cgs)
              + "\n\nRECOMMENDATIONS:\n"
              + (f"• Redistribute load from {most.name}\n" if most.workload>70 else "• Workload balanced\n")
              + "• Continue monitoring critical patients on floors 1-3")
    return {"report":report,"ai":False}

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    # Extract caretaker info from query params
    caretaker_id = ws.query_params.get("caretaker_id")
    caretaker_email = ws.query_params.get("caretaker_email")
    
    await ws.accept()
    # Map email to caregiver ID
    mapped_cg_id = CAREGIVER_EMAIL_MAP.get(caretaker_email, caretaker_id)
    print(f"🔌 WS Connection: caretaker_id={caretaker_id}, caretaker_email={caretaker_email}, mapped_cg_id={mapped_cg_id}")
    print(f"   CAREGIVER_EMAIL_MAP keys: {list(CAREGIVER_EMAIL_MAP.keys())}")
    WS_CLIENTS[ws] = {
        "caretaker_id": mapped_cg_id,
        "caretaker_email": caretaker_email,
        "role": "caretaker" if caretaker_id else "admin"
    }
    print(f"   WS_CLIENTS now has {len(WS_CLIENTS)} clients")
    await ws.send_text(json.dumps({"type":"init","message":"Connected to Quick-Care live feed"}))
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in WS_CLIENTS:
            del WS_CLIENTS[ws]
        print(f"   WS disconnected, now {len(WS_CLIENTS)} clients")
