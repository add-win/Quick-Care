// src/pages/Caregivers.jsx
import { useState, useEffect } from "react";
import { api, STATUS_COLOR, RISK_COLOR, ROLE_LABEL } from "../api";
import { Card, WBar, StatusBadge, SectionHeader, Btn, Badge, Spinner } from "../components/UI";

function CaregiverCard({ cg, patients, selected, onSelect }) {
  const myPts = patients.filter(p => p.caregiver_id === cg.id);
  const critical = myPts.filter(p => p.risk >= 70).length;
  return (
    <div onClick={() => onSelect(cg.id === selected ? null : cg.id)} style={{
      background: selected ? "var(--border-highlight)" : "var(--bg-card)",
      border: `1px solid ${selected ? "#2d6abf" : "var(--border-color)"}`,
      borderRadius: 16, padding: 20, cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: selected ? "0 0 28px #2d6abf20" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-main)" }}>{cg.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {ROLE_LABEL[cg.role]} · Floor {cg.floor}
          </div>
        </div>
        <StatusBadge status={cg.status} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
          <span>Workload</span>
          <span style={{ color: cg.workload>70?"#ff4757":cg.workload>45?"#ffa502":"#2ed573", fontWeight:700 }}>
            {cg.workload?.toFixed(0)}%
          </span>
        </div>
        <WBar value={cg.workload} height={8} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
        {[["👥", myPts.length, "Patients"],["🚨", cg.alarms, "Alarms"],["🔴", critical, "Critical"]].map(([ico,val,lbl]) => (
          <div key={lbl} style={{ background:"var(--bg-main)", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:18, lineHeight:1 }}>{ico}</div>
            <div style={{ fontWeight:800, fontSize:16, color:"var(--text-main)", marginTop:2 }}>{val}</div>
            <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:0.5 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {cg.skills?.map(s => (
          <Badge key={s} label={s} color="#2d6abf" size="sm" />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
        <span>ETA: <span style={{ color: cg.eta===0?"#2ed573":"#ffa502" }}>{cg.eta===0?"Now":`${cg.eta}min`}</span></span>
        <span>Fairness: <span style={{ color: cg.fairness>80?"#2ed573":cg.fairness>60?"#ffa502":"#ff4757", fontWeight:700 }}>
          {cg.fairness?.toFixed(0)}%
        </span></span>
      </div>
    </div>
  );
}

export default function Caregivers() {
  const [caregivers, setCaregivers] = useState([]);
  const [patients,   setPatients]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [rebalancing,setRebalancing]= useState(false);

  const load = async () => {
    const [c, p] = await Promise.all([api.caregivers(), api.patients()]);
    if (c) setCaregivers(c); if (p) setPatients(p);
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const handleRebalance = async () => {
    setRebalancing(true);
    await api.rebalance(); await load();
    setRebalancing(false);
  };

  if (loading) return <Spinner />;
  const selCG = caregivers.find(c => c.id === selected);
  const selPts = selCG ? patients.filter(p => p.caregiver_id === selCG.id) : [];

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="flex-column-mobile" style={{ justifyContent:"space-between", alignItems:"flex-start", gap: 12, marginBottom:20 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:20, color:"var(--text-main)" }}>Caregiver Management</h2>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{caregivers.length} caregivers · {patients.length} patients</div>
        </div>
        <Btn variant="success" onClick={handleRebalance} disabled={rebalancing}>
          {rebalancing ? "⏳ Rebalancing..." : "⚖️ Auto-Rebalance Patients"}
        </Btn>
      </div>

      <div className="grid-responsive" style={{ gap:14, marginBottom:22 }}>
        {caregivers.map(cg => (
          <CaregiverCard key={cg.id} cg={cg} patients={patients}
            selected={selected===cg.id} onSelect={setSelected} />
        ))}
      </div>

      {selCG && (
        <Card style={{ padding:22 }}>
          <SectionHeader title={`${selCG.name}'s Patients (${selPts.length})`} action={
            <Btn variant="ghost" onClick={() => setSelected(null)}>✕ Close</Btn>
          } />
          <div className="grid-stats" style={{ gap:10 }}>
            {selPts.sort((a,b)=>b.risk-a.risk).map(p => (
              <div key={p.id} style={{
                background:"var(--bg-main)", borderRadius:12, padding:14,
                borderLeft:`3px solid ${RISK_COLOR(p.risk)}`,
              }}>
                <div style={{ fontWeight:700, fontSize:13, color:"var(--text-main)", marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)" }}>Rm {p.room} · Age {p.age}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", textTransform:"capitalize", marginBottom:8 }}>
                  {p.disease} · {p.intensity}/10
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-muted)", marginBottom:3 }}>
                    <span>Risk</span><span style={{ color:RISK_COLOR(p.risk), fontWeight:700 }}>{p.risk?.toFixed(0)}</span>
                  </div>
                  <WBar value={p.risk} height={5} />
                </div>
                <div style={{ fontSize:10, color:"var(--text-muted)" }}>
                  ❤️ {p.vitals?.heart_rate?.toFixed(0)} · O₂ {p.vitals?.spo2?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
