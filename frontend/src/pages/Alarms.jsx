// src/pages/Alarms.jsx
import { useState, useEffect } from "react";
import { api, SEV_COLOR } from "../api";
import {
  Card,
  SeverityBadge,
  SectionHeader,
  Btn,
  Spinner,
} from "../components/UI";

const ALARM_ICONS = {
  cardiac: "❤️",
  fall: "🚶",
  wandering: "🗺️",
  spo2: "🫁",
  blood_pressure: "🩸",
  hrv: "📈",
};
const TYPE_OPTIONS = ["cardiac", "fall", "wandering", "spo2", "blood_pressure"];

export default function Alarms({ onAssign }) {
  const [alarms, setAlarms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState(null);
  const [patients, setPatients] = useState([]);

  const load = async () => {
    const [act, hist, pts] = await Promise.all([
      api.activeAlarms(),
      api.alarms(30),
      api.patients(),
    ]);
    if (act) setAlarms(act);
    if (hist) setHistory(hist);
    if (pts) setPatients(pts);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    const onRefresh = () => load();
    window.addEventListener("refresh_alarms", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("refresh_alarms", onRefresh);
    };
  }, []);

  const handleAck = async (id) => {
    setAcking(id);
    await api.ackAlarm(id, "manual");
    await load();
    setAcking(null);
  };

  const triggerManual = async (type) => {
    const pt = patients[Math.floor(Math.random() * patients.length)];
    if (!pt) return;
    onAssign({
      patient_id: pt.id,
      patient_name: pt.name,
      room: pt.room,
      floor: pt.floor,
      alarm_type: type,
      severity: "critical",
    });
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <h2
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text-main)",
          marginBottom: 18,
        }}
      >
      </h2>
      <div className="grid-caretaker" style={{ gap: 18 }}>
        {/* Active */}
        <div>
          <Card style={{ padding: 22, marginBottom: 16 }}>
            <SectionHeader
              title={`🚨 Active Alarms (${alarms.length})`}
              action={
                <span
                  style={{ fontSize: 11, color: "#ff4757", fontWeight: 700 }}
                >
                  {alarms.filter((a) => a.severity === "critical").length}{" "}
                  critical
                </span>
              }
            />
            {alarms.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: 50, color: "var(--text-muted)" }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                No active alarms
              </div>
            ) : (
              alarms.map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: "var(--bg-main)",
                    borderLeft: `4px solid ${SEV_COLOR[a.severity] || "#54a0ff"}`,
                    borderRadius: "0 12px 12px 0",
                    padding: "14px 16px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>
                          {ALARM_ICONS[a.type] || "⚠️"}
                        </span>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "var(--text-main)",
                          }}
                        >
                          {a.patient_name}
                        </span>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Room {a.room} · Floor {a.floor} ·{" "}
                        {a.type?.replace("_", " ").toUpperCase()}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}
                      >
                        Value:{" "}
                        <span
                          style={{
                            color: SEV_COLOR[a.severity],
                            fontWeight: 700,
                          }}
                        >
                          {a.value?.toFixed(1)}
                        </span>
                        <span style={{ margin: "0 6px" }}>·</span>
                        Threshold: {a.threshold}
                        <span style={{ margin: "0 6px" }}>·</span>
                        {new Date(a.ts).toLocaleTimeString()}
                      </div>
                      {a.primary_cg_name && (
                        <div style={{ fontSize: 11, marginTop: 5, fontWeight: 600 }}>
                          <div style={{ color: a.primary_acked ? "#2ed573" : "#ff4757" }}>
                            1st: {a.primary_cg_name} {a.primary_acked ? "(Acked)" : "(Pending)"}
                          </div>
                          {a.secondary_cg_name && (
                            <div style={{ color: a.secondary_acked ? "#2ed573" : "#ffa502" }}>
                              2nd: {a.secondary_cg_name} {a.secondary_acked ? "(Acked)" : "(Pending)"}
                            </div>
                          )}
                          {a.tertiary_cg_name && (
                            <div style={{ color: a.tertiary_acked ? "#2ed573" : "#54a0ff" }}>
                              3rd: {a.tertiary_cg_name} {a.tertiary_acked ? "(Acked)" : "(Pending)"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexShrink: 0,
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          background: a.primary_acked
                            ? "#2ed57350"
                            : "#ffa50250",
                          color: a.primary_acked ? "#2ed573" : "#ffa502",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        {a.primary_acked ? "✓ Acknowledged" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card style={{ padding: 22 }}>
            <SectionHeader
              title="📋 Alarm History"
              action={
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last 30</span>
              }
            />
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              {history.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {ALARM_ICONS[a.type] || "⚠️"}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {a.patient_name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {a.type?.replace("_", " ").toUpperCase()} · Rm {a.room}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <SeverityBadge severity={a.severity} />
                    <span
                      style={{
                        fontSize: 10,
                        color: a.acked ? "#2ed573" : "#ffa502",
                        fontWeight: 700,
                      }}
                    >
                      {a.acked ? "✓ Acked" : "Pending"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {new Date(a.ts).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Manual trigger + stats */}
        <div>
          <Card style={{ padding: 22, marginBottom: 16 }}>
            <SectionHeader title="🔔 Trigger Test Alarm" />
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              Fire a manual alarm to demo the AI assignment engine in real-time.
            </p>
            {TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                onClick={() => triggerManual(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  background: "var(--bg-main)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-main)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  cursor: "pointer",
                  marginBottom: 8,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{ALARM_ICONS[type]}</span>
                Trigger {type.replace("_", " ")} alarm
              </button>
            ))}
          </Card>

          <Card style={{ padding: 22 }}>
            <SectionHeader title="📊 Alarm Statistics" />
            {[
              [
                "Total Generated",
                alarms.length + history.filter((a) => a.acked).length,
                "#54a0ff",
              ],
              ["Active Now", alarms.length, "#ff4757"],
              [
                "Acknowledged",
                history.filter((a) => a.acked).length,
                "#2ed573",
              ],
              [
                "Critical Count",
                alarms.filter((a) => a.severity === "critical").length,
                "#ff4757",
              ],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 800, fontSize: 18, color }}>
                  {val}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
