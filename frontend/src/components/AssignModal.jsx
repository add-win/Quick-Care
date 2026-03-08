// src/components/AssignModal.jsx
import { useState, useEffect } from "react";
import { api, STATUS_COLOR, SEV_COLOR } from "../api";
import { Card, WBar, Badge, Btn, Spinner } from "./UI";

function ScoreRing({ score }) {
  const color = score >= 70 ? "#2ed573" : score >= 50 ? "#ffa502" : "#ff4757";
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: `conic-gradient(${color} ${score*3.6}deg, #1a2035 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: "50%", background: "#0e1220",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 14, color,
      }}>
        {score?.toFixed(0)}%
      </div>
    </div>
  );
}

function RankCard({ rank, cg, label, accent }) {
  if (!cg) return null;
  const bd = cg.breakdown || {};
  return (
    <div style={{
      background: "#080b14", border: `1px solid ${accent}30`,
      borderRadius: 14, padding: 18,
    }}>
      <div style={{ fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
        <ScoreRing score={cg.score} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#dde4f0" }}>{cg.name}</div>
          <div style={{ fontSize: 11, color: "#5a6480", marginTop: 3, textTransform: "capitalize" }}>
            {cg.role?.replace("_"," ")} · Floor {cg.floor}
          </div>
          <div style={{ marginTop: 5 }}>
            <Badge label={cg.status?.replace("_"," ")}
              color={STATUS_COLOR[cg.status]||"#747d8c"} />
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {Object.entries(bd).map(([key, val]) => (
          <div key={key} style={{ background: "#0e1220", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 9, color: "#5a6480", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
              {key}
            </div>
            <WBar value={val} height={5} />
            <div style={{ fontSize: 10, color: "#8892aa", marginTop: 2, fontWeight: 600 }}>{val?.toFixed(0)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", display: "flex", justifyContent: "space-between" }}>
        <span>ETA: <span style={{ color: cg.eta===0?"#2ed573":"#ffa502", fontWeight:700 }}>
          {cg.eta===0?"Immediate":`${cg.eta} min`}
        </span></span>
      </div>
    </div>
  );
}

export default function AssignModal({ alarm, onClose, onDone }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      const r = await api.assign(alarm.patient_id, alarm.alarm_type, alarm.severity);
      if (r) setResult(r);
      else setError("Could not reach backend. Check that FastAPI is running on port 8000.");
      setLoading(false);
    })();
  }, [alarm]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000bb",
      backdropFilter: "blur(4px)", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#0b0e18", border: "1px solid #1a2035",
        borderRadius: 22, width: "min(780px, 100%)",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 0 80px #2d6abf18",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "22px 28px", borderBottom: "1px solid #1a2035",
          position: "sticky", top: 0, background: "#0b0e18", zIndex: 1,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: "#dde4f0", margin: 0 }}>
                AI Assignment Engine
              </h2>
            </div>
            <div style={{ fontSize: 12, color: "#5a6480", marginTop: 5, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span>Patient: <span style={{ color: "#dde4f0" }}>{alarm.patient_name}</span></span>
              <span>Room: <span style={{ color: "#dde4f0" }}>{alarm.room}</span></span>
              <span>Type: <span style={{ color: "#dde4f0", textTransform: "capitalize" }}>{alarm.alarm_type?.replace("_"," ")}</span></span>
              <Badge label={alarm.severity} color={SEV_COLOR[alarm.severity]||"#54a0ff"} />
            </div>
          </div>
          <Btn variant="ghost" onClick={onClose}>✕ Close</Btn>
        </div>

        <div style={{ padding: 28 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
              <div style={{ color: "#3d87d4", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                Scoring all caregivers...
              </div>
              <div style={{ color: "#5a6480", fontSize: 12 }}>
                Analyzing workload · proximity · skills · fairness · ETA
              </div>
              <Spinner />
            </div>
          )}

          {error && (
            <div style={{ background: "#ff47571a", border: "1px solid #ff475740", borderRadius: 12, padding: 20, color: "#ff4757" }}>
              {error}
            </div>
          )}

          {result && (
            <>
              {/* AI Explanation */}
              <div style={{
                background: "#0e1220", border: "1px solid #2d6abf30",
                borderRadius: 14, padding: 18, marginBottom: 22,
              }}>
                <div style={{ fontSize: 11, color: "#3d87d4", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                  💡 AI Reasoning
                </div>
                <p style={{ fontSize: 13, color: "#a8b4cc", lineHeight: 1.7, margin: 0 }}>
                  {result.explanation}
                </p>
              </div>

              {/* Top 3 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
                <RankCard rank={1} cg={result.primary}   label="🥇 Primary"   accent="#2ed573" />
                <RankCard rank={2} cg={result.secondary} label="🥈 Secondary" accent="#ffa502" />
                <RankCard rank={3} cg={result.backup}    label="🥉 Backup"    accent="#ff6b6b" />
              </div>

              {/* Full ranking table */}
              <Card style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "#5a6480", fontWeight: 700, marginBottom: 12 }}>
                  FULL RANKING — ALL CAREGIVERS
                </div>
                {result.all?.map((cg, i) => (
                  <div key={cg.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", borderBottom: "1px solid #0f1525",
                    background: i===0 ? "#0d1f10" : "transparent",
                    borderRadius: i===0 ? 8 : 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>
                        {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}
                      </span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#dde4f0" }}>{cg.name}</span>
                        <span style={{ fontSize: 11, color: "#5a6480", marginLeft: 8, textTransform: "capitalize" }}>
                          {cg.role?.replace("_"," ")} · F{cg.floor}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: STATUS_COLOR[cg.status]||"#747d8c", textTransform: "capitalize" }}>
                        {cg.status?.replace("_"," ")}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 16,
                        color: cg.score>=70?"#2ed573":cg.score>=50?"#ffa502":"#ff4757",
                        fontVariantNumeric: "tabular-nums", width: 48, textAlign:"right" }}>
                        {cg.score?.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                <Btn variant="success" onClick={async () => {
                  try {
                    await api.confirmAssign(result);
                    if (onDone) onDone(result);
                  } finally {
                    onClose();
                  }
                }}
                  style={{ padding: "10px 24px", fontSize: 13 }}>
                  ✅ Confirm — Assign {result.primary?.name}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
