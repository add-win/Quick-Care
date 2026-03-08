// src/components/UI.jsx — Shared design-system components
import { RISK_COLOR, STATUS_COLOR, SEV_COLOR } from "../api";

export function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${glow ? glow + "40" : "var(--border-color)"}`,
      borderRadius: 16,
      boxShadow: glow ? `0 0 24px ${glow}18` : "var(--card-shadow)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Badge({ label, color, size = "sm" }) {
  const pad = size === "sm" ? "2px 9px" : "4px 14px";
  const fs  = size === "sm" ? 10 : 12;
  return (
    <span style={{
      background: color + "1a", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: pad, fontSize: fs, fontWeight: 700,
      letterSpacing: 0.3, textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const labels = {
    available:"Available", attending:"Attending", on_rounds:"On Rounds",
    on_break:"On Break", out_of_premises:"Away"
  };
  return <Badge label={labels[status] || status} color={STATUS_COLOR[status] || "#747d8c"} />;
}

export function SeverityBadge({ severity }) {
  return <Badge label={severity} color={SEV_COLOR[severity] || "#54a0ff"} />;
}

export function RiskBadge({ risk }) {
  const label = risk >= 70 ? "Critical" : risk >= 40 ? "Warning" : "Stable";
  return <Badge label={`${risk.toFixed(0)} ${label}`} color={RISK_COLOR(risk)} />;
}

export function WBar({ value, height = 8 }) {
  const color = value > 70 ? "#ff4757" : value > 45 ? "#ffa502" : "#2ed573";
  return (
    <div style={{ background: "var(--bg-card-hover)", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(100, value)}%`, height: "100%", background: color,
        borderRadius: 99, transition: "width 0.6s ease",
        boxShadow: value > 70 ? `0 0 8px ${color}80` : "none",
      }} />
    </div>
  );
}

export function StatCard({ icon, label, value, color = "#dde4f0", sub }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#3d87d4", marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 16 }}>
      <div style={{
        width: 36, height: 36, border: "3px solid var(--border-color)",
        borderTop: "3px solid #3d87d4", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color: "#3d87d4", fontSize: 13 }}>Loading...</div>
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)", letterSpacing: -0.2 }}>{title}</h3>
      {action}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const variants = {
    primary:  { background: "linear-gradient(135deg,#1e4a8a,#0d2855)", border: "1px solid #2d6abf50", color: "#54a0ff" },
    danger:   { background: "#ff47571a", border: "1px solid #ff475740", color: "#ff4757" },
    ghost:    { background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-muted)" },
    success:  { background: "#2ed5731a", border: "1px solid #2ed57340", color: "#2ed573" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], borderRadius: 10, padding: "7px 16px",
      cursor: disabled ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700,
      fontFamily: "inherit", opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      letterSpacing: 0.3, ...style,
    }}>
      {children}
    </button>
  );
}
