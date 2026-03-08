// src/api.js — All API calls in one place
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function req(path, opts = {}) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`API error ${path}:`, e.message);
    return null;
  }
}

export const api = {
  // Stats
  stats: () => req("/stats"),
  // Caregivers
  caregivers: () => req("/caregivers"),
  setStatus: (id, status) =>
    req(`/caregivers/${id}/status?status=${status}`, { method: "PUT" }),
  // Patients
  patients: () => req("/patients"),
  topRisk: (n = 10) => req(`/patients/top-risk?n=${n}`),
  rebalance: () => req("/rebalance", { method: "POST" }),
  // Alarms
  alarms: (limit = 40) => req(`/alarms?limit=${limit}`),
  activeAlarms: () => req("/alarms/active"),
  ackAlarm: (id, cgId = "") =>
    req(`/alarms/${id}/ack?cg_id=${cgId}`, { method: "POST" }),
  caretakerAckAlarm: (id, cgId = "") =>
    req(`/alarms/${id}/caretaker-ack?cg_id=${cgId}`, { method: "POST" }),
  // Assignment
  assign: (patientId, alarmType, severity) =>
    req("/assign", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        alarm_type: alarmType,
        severity,
      }),
    }),
  confirmAssign: (result) =>
    req("/confirm_assignment", {
      method: "POST",
      body: JSON.stringify({ result }),
    }),
  assignments: (limit = 20) => req(`/assignments?limit=${limit}`),
  // Analytics
  analytics: () => req("/analytics/workload"),
  riskDist: () => req("/analytics/risk-distribution"),
  report: () => req("/analytics/report"),
};

// WebSocket helper
export function createWS(onMessage, caretakerId = null, caretakerEmail = null) {
  let wsUrl = "ws://localhost:8000/ws";
  if (caretakerId && caretakerEmail) {
    wsUrl += `?caretaker_id=${caretakerId}&caretaker_email=${caretakerEmail}`;
  }
  console.log(`📡 Creating WebSocket: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    console.log("✅ WS connected:", wsUrl);
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      console.log("📩 WS message received:", msg);
      onMessage(msg);
    } catch (err) {
      console.error("⚠️ WS message parse error:", err, e.data);
    }
  };
  ws.onerror = (e) => console.warn("⚠️ WS error", e);
  ws.onclose = () => console.log("❌ WS closed");
  return ws;
}

// Colour helpers
export const RISK_COLOR = (r) =>
  r >= 70 ? "#ff4757" : r >= 40 ? "#ffa502" : "#2ed573";
export const STATUS_COLOR = {
  available: "#2ed573",
  attending: "#ffa502",
  on_rounds: "#54a0ff",
  on_break: "#747d8c",
  out_of_premises: "#ff4757",
};
export const SEV_COLOR = {
  critical: "#ff4757",
  warning: "#ffa502",
  info: "#54a0ff",
};
export const DISEASE_ICON = {
  cardiac: "❤️",
  dementia: "🧠",
  diabetes: "💉",
  respiratory: "🫁",
  mobility: "🦽",
  general: "👤",
};
export const ROLE_LABEL = {
  senior_nurse: "Sr. Nurse",
  nurse: "Nurse",
  caregiver: "Caregiver",
};
