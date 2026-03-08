// src/pages/Patients.jsx
import { useState, useEffect } from "react";
import { api, RISK_COLOR, DISEASE_ICON } from "../api";
import { Card, WBar, RiskBadge, Spinner, SectionHeader, Btn } from "../components/UI";

export default function Patients({ onAssign }) {
  const [patients,  setPatients]  = useState([]);
  const [care,      setCare]      = useState({});
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    const [p, c] = await Promise.all([api.patients(), api.caregivers()]);
    if (p) setPatients(p);
    if (c) { const m={}; c.forEach(g=>{m[g.id]=g;}); setCare(m); }
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const FILTERS = ["all","critical","warning","stable","cardiac","dementia","diabetes","respiratory","mobility","general"];

  const shown = patients
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.room.includes(search))
    .filter(p => {
      if (filter==="all") return true;
      if (filter==="critical") return p.risk>=70;
      if (filter==="warning")  return p.risk>=40 && p.risk<70;
      if (filter==="stable")   return p.risk<40;
      return p.disease===filter;
    })
    .sort((a,b) => b.risk-a.risk);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-column-mobile" style={{ justifyContent:"space-between", alignItems:"flex-start", gap: 12, marginBottom:18 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:20, color:"var(--text-main)", margin:0 }}>Patient Registry</h2>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{shown.length} of {patients.length} patients</div>
        </div>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search name or room..."
          style={{
            background:"var(--input-bg)", border:"1px solid var(--border-color)", color:"var(--text-main)",
            borderRadius:10, padding:"8px 14px", fontSize:13, width:220,
            fontFamily:"inherit", outline:"none",
          }}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter===f ? "#1e4a8a" : "var(--bg-card)",
            border: `1px solid ${filter===f ? "#2d6abf" : "var(--border-color)"}`,
            color: filter===f ? "#54a0ff" : "var(--text-muted)",
            borderRadius: 20, padding: "4px 14px", cursor:"pointer",
            fontSize: 11, fontWeight:600, textTransform:"capitalize",
            fontFamily:"inherit", transition:"all 0.15s",
          }}>{f}</button>
        ))}
      </div>

      <Card style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--bg-main)", borderBottom:"1px solid var(--border-color)" }}>
                {["Patient","Age","Room / Floor","Disease","Intensity","Risk","Vitals","Caregiver","Action"].map(h => (
                  <th key={h} style={{
                    padding:"11px 14px", textAlign:"left",
                    fontSize:10, color:"var(--text-muted)", fontWeight:700,
                    letterSpacing:0.8, textTransform:"uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((p,i) => {
                const cg = care[p.caregiver_id];
                return (
                  <tr key={p.id} style={{
                    borderBottom:"1px solid var(--border-color)",
                    background: i%2===0 ? "transparent" : "var(--bg-card-hover)",
                    transition:"background 0.1s",
                  }}>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"var(--text-main)" }}>{p.name}</div>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-muted)" }}>{p.age}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-muted)" }}>
                      Rm {p.room} · F{p.floor}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ fontSize:13, textTransform:"capitalize", color:"var(--text-muted)" }}>
                        {DISEASE_ICON[p.disease]} {p.disease}
                      </span>
                    </td>
                    <td style={{ padding:"11px 14px", minWidth:100 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1 }}><WBar value={p.intensity*10} height={5} /></div>
                        <span style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{p.intensity}/10</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8,height:8,borderRadius:"50%",background:RISK_COLOR(p.risk),
                          boxShadow:`0 0 6px ${RISK_COLOR(p.risk)}` }} />
                        <span style={{ fontWeight:800, color:RISK_COLOR(p.risk), fontSize:14, fontVariantNumeric:"tabular-nums" }}>
                          {p.risk?.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                        ❤️ {p.vitals?.heart_rate?.toFixed(0)}
                        <span style={{ display:"block" }}>O₂ {p.vitals?.spo2?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ fontSize:12, color:"#3d87d4" }}>{cg?.name || "—"}</span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      {p.risk >= 40 && (
                        <Btn variant="primary" onClick={() => onAssign({
                          patient_id:p.id, patient_name:p.name, room:p.room,
                          floor:p.floor, alarm_type:"cardiac",
                          severity: p.risk>=70?"critical":"warning",
                        })}>
                          Assign
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
