// src/App.js — Root application shell
import { useState, useEffect, useRef } from "react";
import { createWS } from "./api";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Caregivers from "./pages/Caregivers";
import Patients from "./pages/Patients";
import Alarms from "./pages/Alarms";
import Analytics from "./pages/Analytics";
import CaretakerDashboard from "./pages/CaretakerDashboard";
import AssignModal from "./components/AssignModal";

const NAV = [
  { key: "overview", icon: "📊", label: "Overview" },
  { key: "caregivers", icon: "👩‍⚕️", label: "Caregivers" },
  { key: "patients", icon: "🏥", label: "Patients" },
  { key: "alarms", icon: "🚨", label: "Alarms" },
  { key: "analytics", icon: "📈", label: "Analytics" },
];

export default function App() {
  // Authentication
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    role: null,
    userEmail: null,
  });

  // Admin dashboard
  const [tab, setTab] = useState("overview");
  const [assignAlarm, setAssign] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [theme, setTheme] = useState("dark");
  const wsRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      wsRef.current = createWS((msg) => {
        setConnected(true);
        if (msg.type === "vitals_update" && msg.new_alarms?.length > 0) {
          setLiveCount((c) => c + msg.new_alarms.length);
          const a = msg.new_alarms[0];
          if (a.severity === "critical") {
            setToast({
              msg: `🚨 CRITICAL: ${a.patient_name} — ${a.type?.toUpperCase()}`,
              color: "#ff4757",
            });
            setTimeout(() => setToast(null), 5000);
          }
          window.dispatchEvent(new Event("refresh_alarms"));
        }
        if (msg.type === "alarm_update") {
          window.dispatchEvent(new Event("refresh_alarms"));
        }
        if (msg.type === "init") setConnected(true);
      });
      wsRef.current.onopen = () => setConnected(true);
      wsRef.current.onclose = () => setConnected(false);
    } catch { }
    return () => wsRef.current?.close();
  }, []);

  // Auth handlers
  const handleAdminLogin = () => {
    setAuth({ isLoggedIn: true, role: "admin", userEmail: "admin@gmail.com" });
  };

  const handleCaretakerLogin = (data) => {
    setAuth({ isLoggedIn: true, role: "caretaker", userEmail: data.email });
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, role: null, userEmail: null });
  };

  // If not logged in, show login page
  if (!auth.isLoggedIn) {
    return (
      <Login
        onAdminLogin={handleAdminLogin}
        onCaretakerLogin={handleCaretakerLogin}
      />
    );
  }

  // Show caretaker dashboard if role is caretaker
  if (auth.role === "caretaker") {
    return (
      <div style={{ position: "relative" }}>
        <CaretakerDashboard userEmail={auth.userEmail} />
        <button
          onClick={handleLogout}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#ff4757",
            border: "none",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 1000,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#ff6b7a")}
          onMouseLeave={(e) => (e.target.style.background = "#ff4757")}
        >
          Logout
        </button>
      </div>
    );
  }

  // Admin dashboard (default)
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        fontFamily: "'Syne', sans-serif",
        color: "var(--text-main)",
      }}
    >
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: isMobile ? "fixed" : "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          background: "var(--bg-header)",
          borderRight: "1px solid var(--header-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transform:
            isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.3s ease",
          overflow: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            borderBottom: "1px solid var(--header-border)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            height: 90,
            padding: "8px 12px",
          }}
        >
          <img src={theme === "dark" ? "/LOGOlight.png" : "/LOGOdark.png"} alt="Quick-Care Logo" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>

        {/* Nav */}
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                setTab(n.key);
                if (isMobile) setSidebarOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                background: tab === n.key ? "var(--header-hover)" : "transparent",
                border: `1px solid ${tab === n.key ? "#2d6abf40" : "transparent"}`,
                color: tab === n.key ? "#54a0ff" : "var(--header-muted)",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: tab === n.key ? 700 : 500,
                fontFamily: "inherit",
                transition: "all 0.15s",
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>
                {n.icon}
              </span>
              {n.label}
              {n.key === "alarms" && liveCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#ff4757",
                    color: "#fff",
                    borderRadius: "50%",
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {liveCount > 99 ? "99+" : liveCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Status footer */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--header-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connected ? "#2ed573" : "#ff4757",
                boxShadow: connected ? "0 0 8px #2ed573" : "0 0 8px #ff4757",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--header-muted)" }}>
              {connected ? "Live monitoring" : "Connecting..."}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--header-muted)", marginTop: 6 }}>
            40 patients · 6 caregivers
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          marginLeft: isMobile ? 0 : 220,
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: "var(--bg-header)",
            borderBottom: "1px solid var(--header-border)",
            padding: isMobile ? "0 14px" : "0 28px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 90,
            gap: 12,
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--header-text)",
                fontSize: 20,
                cursor: "pointer",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
          <div
            style={{
              fontWeight: 700,
              fontSize: isMobile ? 13 : 15,
              color: "var(--header-text)",
              flex: 1,
            }}
          >
            {NAV.find((n) => n.key === tab)?.icon}{" "}
            {NAV.find((n) => n.key === tab)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--header-text)",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Toggle Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div
              style={{
                fontSize: isMobile ? 10 : 12,
                color: "var(--header-muted)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
              }}
            >
              {!isMobile && (
                <>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  <span style={{ margin: "0 12px", color: "var(--header-border)" }}>|</span>
                </>
              )}
              <span style={{ color: "#2ed573", marginLeft: isMobile ? 0 : 0 }}>● Live</span>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? "16px 12px" : "24px 28px" }}>
          {tab === "overview" && <Overview onAssign={setAssign} />}
          {tab === "caregivers" && <Caregivers />}
          {tab === "patients" && <Patients onAssign={setAssign} />}
          {tab === "alarms" && <Alarms onAssign={setAssign} />}
          {tab === "analytics" && <Analytics />}
        </div>
      </div>

      {/* Assignment modal */}
      {assignAlarm && (
        <AssignModal
          alarm={assignAlarm}
          onClose={() => setAssign(null)}
          onDone={() => setLiveCount(0)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: toast.color + "18",
            border: `1px solid ${toast.color}50`,
            color: toast.color,
            borderRadius: 12,
            padding: "14px 20px",
            fontSize: 13,
            fontWeight: 700,
            maxWidth: 340,
            boxShadow: `0 4px 24px ${toast.color}30`,
            animation: "slideIn 0.3s ease",
          }}
        >
          {toast.msg}
          <style>{`@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#ff4757",
          border: "none",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          zIndex: 1000,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = "#ff6b7a")}
        onMouseLeave={(e) => (e.target.style.background = "#ff4757")}
      >
        Logout
      </button>
    </div>
  );
}
