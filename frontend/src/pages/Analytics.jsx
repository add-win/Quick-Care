// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Card, SectionHeader, WBar, Btn, Spinner } from "../components/UI";

const COLORS = ["#54a0ff","#2ed573","#ffa502","#a29bfe","#ff4757","#00cec9"];
const TT_STYLE = { background:"var(--bg-card)", border:"1px solid var(--border-color)", borderRadius:10, fontSize:12, color:"var(--text-main)" };

export default function Analytics() {
  const [workload, setWorkload]  = useState([]);
  const [riskDist, setRiskDist]  = useState(null);
  const [report,   setReport]    = useState(null);
  const [loadRpt,  setLoadRpt]   = useState(false);
  const [assignments, setAssign] = useState([]);
  const [loading,  setLoading]   = useState(true);

  const load = async () => {
    const [w, r, a] = await Promise.all([api.analytics(), api.riskDist(), api.assignments(15)]);
    if (w) setWorkload(w); if (r) setRiskDist(r); if (a) setAssign(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fetchReport = async () => {
    setLoadRpt(true); const r = await api.report();
    if (r) setReport(r); setLoadRpt(false);
  };

  if (loading) return <Spinner />;

  const riskChartData = riskDist ? [
    { name:"Critical", value:riskDist.critical, color:"#ff4757" },
    { name:"High",     value:riskDist.high,     color:"#ff6b6b" },
    { name:"Medium",   value:riskDist.medium,   color:"#ffa502" },
    { name:"Low",      value:riskDist.low,       color:"#2ed573" },
  ] : [];

  const fairnessData = workload.map(c => ({
    cg: c.name.split(" ")[0],
    Workload: Math.round(c.workload),
    Fairness: Math.round(c.fairness),
    Alarms: c.alarms,
  }));

  const radarData = workload.map(c => ({
    name: c.name.split(" ")[0],
    Workload: Math.round(c.workload),
    Fairness: Math.round(c.fairness),
    Patients: Math.min(100, c.patients*12),
    Alarms: Math.min(100, c.alarms*20),
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 20, color: "var(--text-main)" }}>Analytics &amp; Reports</h2>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Real-time shift intelligence</div>
      </div>

      <div className="grid-2col">

        {/* Workload bar chart */}
        <Card style={{ padding:22 }}>
          <SectionHeader title="📊 Caregiver Workload vs Fairness" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fairnessData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="cg" tick={{ fill:"var(--text-muted)", fontSize:11 }} />
              <YAxis domain={[0,100]} tick={{ fill:"var(--text-muted)", fontSize:11 }} />
              <Tooltip contentStyle={TT_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color:"var(--text-muted)" }} />
              <Bar dataKey="Workload" fill="#ff4757" radius={[4,4,0,0]} />
              <Bar dataKey="Fairness" fill="#2ed573" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk distribution donut-ish */}
        <Card style={{ padding:22 }}>
          <SectionHeader title="🏥 Patient Risk Distribution" />
          <div className="grid-2col" style={{ gap:10, marginBottom:12 }}>
            {riskChartData.map(r => (
              <div key={r.name} style={{
                background:"var(--bg-main)", borderRadius:12, padding:14,
                borderLeft:`3px solid ${r.color}`,
              }}>
                <div style={{ fontSize:24, fontWeight:800, color:r.color }}>{r.value}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", marginTop:2, letterSpacing:0.5 }}>{r.name}</div>
                <div style={{ marginTop:8 }}><WBar value={r.value/(riskDist?.total_patients||40)*100} height={5} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid-2col">

        {/* Radar chart */}
        <Card style={{ padding:22 }}>
          <SectionHeader title="🕸️ Caregiver Performance Radar" />
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="name" tick={{ fill:"var(--text-muted)", fontSize:11 }} />
              {["Workload","Fairness","Patients","Alarms"].map((key,i) => (
                <Radar key={key} name={key} dataKey={key}
                  stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15}
                  strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize:11, color:"var(--text-muted)" }} />
              <Tooltip contentStyle={TT_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Assignment audit */}
        <Card style={{ padding:22 }}>
          <SectionHeader title="📋 Recent Assignments" />
          <div style={{ maxHeight:260, overflow:"auto" }}>
            {assignments.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)", fontSize:13 }}>No assignments yet</div>
            ) : assignments.map((a,i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 12px", borderBottom:"1px solid var(--border-color)",
              }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-main)" }}>{a.patient}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, textTransform:"capitalize" }}>
                    {a.alarm_type} → <span style={{ color:"#3d87d4" }}>{a.primary?.name}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#2ed573" }}>{a.primary?.score?.toFixed(0)}%</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)" }}>{new Date(a.ts).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fairness bars */}
      <Card style={{ padding:22, marginBottom:18 }}>
        <SectionHeader title="⚖️ Fairness & Stress Index" />
        <div className="grid-2col" style={{ gap:20 }}>
          {workload.map((c,i) => (
            <div key={c.name}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--text-main)" }}>{c.name}</span>
                  <span style={{ fontSize:10, color:"var(--text-muted)", marginLeft:8, textTransform:"uppercase" }}>{c.role?.replace("_"," ")}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color: c.fairness>80?"#2ed573":c.fairness>60?"#ffa502":"#ff4757" }}>
                  {c.fairness?.toFixed(0)}%
                </span>
              </div>
              <WBar value={c.fairness} height={8} />
            </div>
          ))}
        </div>
      </Card>


    </div>
  );
}
