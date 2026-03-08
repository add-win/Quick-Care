// src/pages/Login.jsx — Landing & Auth page
import { useState } from "react";
import { Btn } from "../components/UI";

// Caretaker credentials
const CARETAKER_CREDS = {
  "maria@gmail.com": "maria",
  "james@gmail.com": "james",
  "priya@gmail.com": "priya",
  "tom@gmail.com": "tom",
  "lisa@gmail.com": "lisa",
  "sam@gmail.com": "sam",
};

// Map emails to names for easier reference
const CARETAKER_NAMES = {
  "maria@gmail.com": "Maria John",
  "james@gmail.com": "James Lee",
  "priya@gmail.com": "Priya Mehta",
  "tom@gmail.com": "Tom Walsh",
  "lisa@gmail.com": "Lisa Chen",
  "sam@gmail.com": "Sam Okafor",
};

export default function Login({ onAdminLogin, onCaretakerLogin }) {
  const [mode, setMode] = useState("landing"); // landing | admin-login | caretaker-login
  const [adminEmail, setAdminEmail] = useState("admin@gmail.com");
  const [adminPass, setAdminPass] = useState("");
  const [careEmail, setCareEmail] = useState("");
  const [carePass, setCarePass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    setError("");
    setLoading(true);
    if (adminEmail === "admin@gmail.com" && adminPass === "admin") {
      onAdminLogin();
    } else {
      setError("Invalid admin credentials");
    }
    setLoading(false);
  };

  const handleCaretakerLogin = async () => {
    setError("");
    setLoading(true);
    if (!careEmail || !carePass) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }
    // Validate against predefined caretaker credentials
    if (CARETAKER_CREDS[careEmail] && CARETAKER_CREDS[careEmail] === carePass) {
      onCaretakerLogin({ email: careEmail, name: CARETAKER_NAMES[careEmail] });
    } else {
      setError("Invalid caretaker credentials");
    }
    setLoading(false);
  };

  if (mode === "landing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #080b14 0%, #0d1526 60%, #0a1020 100%)",
          fontFamily: "'Syne', sans-serif",
          color: "#dde4f0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Navbar */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 48px",
            borderBottom: "1px solid #ffffff0a",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <img src="/LOGOlight.png" alt="Quick-Care" style={{ height: 80, width: "auto" }} />
        </nav>

        {/* Responsive styles */}
        <style>{`
          .lp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .lp-left { padding-right: 60px; }
          @media (max-width: 768px) {
            .lp-grid { grid-template-columns: 1fr; }
            .lp-left { padding-right: 0; margin-top: 32px; order: 2; }
            .lp-right { order: 1; }
            .lp-hero { font-size: 32px !important; }
            .lp-wrap { padding: 28px 20px !important; }
          }
        `}</style>

        {/* Main Split Layout */}
        <div
          className="lp-wrap"
          style={{
            flex: 1,
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
            padding: "60px 48px",
            alignItems: "center",
          }}
        >
          <div className="lp-grid" style={{ alignItems: "center" }}>
          {/* LEFT — Description */}
          <div className="lp-left">

            <h1
              className="lp-hero"
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: 20,
                letterSpacing: -1.5,
                background: "linear-gradient(135deg, #dde4f0 30%, #54a0ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Smart Caregiver
              <br />
              Workload Engine
            </h1>

            <p
              style={{
                fontSize: 15,
                color: "#7a8aaa",
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 440,
              }}
            >
              Quick-Care intelligently assigns caregivers to patients in real-time
              using AI, reducing response times and optimizing workload distribution
              across your entire facility.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
              {[
                { icon: "📊", title: "Real-time Monitoring", desc: "Live vitals tracking across 40+ patients simultaneously" },
                { icon: "🧠", title: "AI Assignment Engine", desc: "Dynamically assigns caregivers based on workload & proximity" },
                { icon: "🚨", title: "Smart Alarm Routing", desc: "Critical alerts escalated instantly with severity scoring" },
                { icon: "📈", title: "Analytics Dashboard", desc: "Insights on caregiver efficiency and patient outcomes" },
              ].map((f) => (
                <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#1e293b",
                      border: "1px solid #2d3a52",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c8d4e8", marginBottom: 2 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#4a5a78", lineHeight: 1.5 }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32 }}>
              {[
                { val: "40+", label: "Patients" },
                { val: "6", label: "Caregivers" },
                { val: "99.9%", label: "Uptime" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#54a0ff" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#3a4560", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Login Cards */}
          <div className="lp-right" style={{ display: "flex", flexDirection: "column", gap: 16, alignSelf: "flex-start", marginTop: -40 }}>
            <p style={{ fontSize: 12, color: "#3a4560", fontWeight: 700, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
              Select your role to continue
            </p>

            {/* Admin Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #0b0e1a, #0f1628)",
                border: "1px solid #1e4a8a",
                borderRadius: 20,
                padding: 32,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onClick={() => { setMode("admin-login"); setError(""); }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#54a0ff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px #2d6abf20";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e4a8a";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 36 }}>👨‍💼</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#dde4f0" }}>Admin Dashboard</div>
                  <div style={{ fontSize: 11, color: "#4a5a78" }}>Full system control</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#1e4a8a", fontSize: 20 }}>→</div>
              </div>
              <p style={{ fontSize: 12, color: "#4a5a78", lineHeight: 1.6, marginBottom: 18 }}>
                Hospital-wide patient monitoring, caregiver management, alarm routing, and detailed analytics.
              </p>
              <button
                style={{
                  background: "linear-gradient(135deg, #1e4a8a, #2d6abf)",
                  border: "none",
                  color: "#fff",
                  padding: "11px 24px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.target.style.opacity = "1")}
              >
                Login as Admin →
              </button>
            </div>

            {/* Caretaker Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #0b1a10, #0a160d)",
                border: "1px solid #1e8a50",
                borderRadius: 20,
                padding: 32,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onClick={() => { setMode("caretaker-login"); setError(""); }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2ed573";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px #2ed57318";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e8a50";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 36 }}>👩‍⚕️</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#dde4f0" }}>Caretaker Panel</div>
                  <div style={{ fontSize: 11, color: "#2a4a38" }}>Mobile-first interface</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#1e8a50", fontSize: 20 }}>→</div>
              </div>
              <p style={{ fontSize: 12, color: "#2a4a38", lineHeight: 1.6, marginBottom: 18 }}>
                Real-time patient alerts, care checklists, task tracking, and shift management on any device.
              </p>
              <button
                style={{
                  background: "linear-gradient(135deg, #1e8a50, #2ed573)",
                  border: "none",
                  color: "#fff",
                  padding: "11px 24px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.target.style.opacity = "1")}
              >
                Login as Caretaker →
              </button>
            </div>

            {/* Footer note */}
            <p style={{ fontSize: 10, color: "#2a3048", textAlign: "center", marginTop: 4 }}>
              🔒 HIPAA Compliant · End-to-end encrypted · Real-time monitoring
            </p>
          </div>
          </div> {/* end lp-grid */}
        </div>
      </div>
    );
  }


  if (mode === "admin-login") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0d16 0%, #1a2035 100%)",
          fontFamily: "'Syne', sans-serif",
          color: "#dde4f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zoom: 0.87,
        }}
      >
        <div
          style={{
            background: "#0b0e18",
            border: "1px solid #1e4a8a",
            borderRadius: 16,
            padding: 40,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 0 60px #2d6abf18",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍💼</div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Admin Login</h2>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#5a6480",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#080b14",
                border: "1px solid #1a2035",
                borderRadius: 10,
                color: "#dde4f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#5a6480",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#080b14",
                border: "1px solid #1a2035",
                borderRadius: 10,
                color: "#dde4f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#ff475720",
                border: "1px solid #ff475750",
                color: "#ff4757",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleAdminLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: "#1e4a8a",
              border: "1px solid #2d6abf",
              color: "#54a0ff",
              padding: "12px 16px",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 12,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              !loading && (e.target.style.background = "#2d6abf")
            }
            onMouseLeave={(e) =>
              !loading && (e.target.style.background = "#1e4a8a")
            }
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            onClick={() => {
              setMode("landing");
              setError("");
              setAdminPass("");
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid #1a2035",
              color: "#5a6480",
              padding: "10px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#3a4560")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#1a2035")}
          >
            Back to Home
          </button>

          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              color: "#3a4560",
              textAlign: "center",
            }}
          >
            Demo Credentials:
            <br />
            <span
              style={{
                color: "#54a0ff",
                fontFamily: "monospace",
                fontSize: 10,
              }}
            >
              admin@gmail.com / admin
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "caretaker-login") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0d16 0%, #1a2035 100%)",
          fontFamily: "'Syne', sans-serif",
          color: "#dde4f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zoom: 0.87,
        }}
      >
        <div
          style={{
            background: "#0b0e18",
            border: "1px solid #1e8a50",
            borderRadius: 16,
            padding: 40,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 0 60px #2ed57318",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👩‍⚕️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Caretaker Login</h2>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#5a6480",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={careEmail}
              onChange={(e) => setCareEmail(e.target.value)}
              placeholder="your.email@hospital.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#080b14",
                border: "1px solid #1a2035",
                borderRadius: 10,
                color: "#dde4f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#5a6480",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={carePass}
              onChange={(e) => setCarePass(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCaretakerLogin()}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#080b14",
                border: "1px solid #1a2035",
                borderRadius: 10,
                color: "#dde4f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#ff475720",
                border: "1px solid #ff475750",
                color: "#ff4757",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleCaretakerLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: "#1e8a50",
              border: "1px solid #2ed573",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 12,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              !loading && (e.target.style.background = "#2ed573")
            }
            onMouseLeave={(e) =>
              !loading && (e.target.style.background = "#1e8a50")
            }
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            onClick={() => {
              setMode("landing");
              setError("");
              setCareEmail("");
              setCarePass("");
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid #1a2035",
              color: "#5a6480",
              padding: "10px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#3a4560")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#1a2035")}
          >
            Back to Home
          </button>

          <div
            style={{
              marginTop: 16,
              fontSize: 10,
              color: "#3a4560",
              textAlign: "center",
              background: "#080b1450",
              padding: "10px 12px",
              borderRadius: 8,
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#5a6480" }}>
              Demo Credentials:
            </div>
            <div style={{ fontSize: 9, color: "#5a6480", lineHeight: 1.6 }}>
              maria@gmail.com / maria
              <br />
              james@gmail.com / james
              <br />
              priya@gmail.com / priya
              <br />
              tom@gmail.com / tom
              <br />
              lisa@gmail.com / lisa
              <br />
              sam@gmail.com / sam
            </div>
          </div>
        </div>
      </div>
    );
  }
}
