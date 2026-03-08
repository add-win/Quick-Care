// src/pages/CaretakerDashboard.jsx — Caretaker-specific panel
import { useState, useEffect, useRef } from "react";
import { createWS, api } from "../api";
import { Card, Btn } from "../components/UI";

const CHECKLISTS = {
  routine_rounds: {
    icon: "🚶",
    title: "Routine Rounds",
    description: "Patient vital signs check and general welfare",
    tasks: [
      { id: "r1", name: "Check vital signs", completed: false },
      { id: "r2", name: "Monitor hydration levels", completed: false },
      { id: "r3", name: "Check wound dressings", completed: false },
      { id: "r4", name: "Assess pain levels", completed: false },
    ],
  },
  feeding: {
    icon: "🍽️",
    title: "Feeding & Hydration",
    description: "Ensure proper nutrition and water intake",
    tasks: [
      { id: "f1", name: "Assist with breakfast", completed: false },
      { id: "f2", name: "Monitor fluid intake", completed: false },
      { id: "f3", name: "Check dietary restrictions", completed: false },
      { id: "f4", name: "Document intake/output", completed: false },
    ],
  },
  medicine: {
    icon: "💊",
    title: "Medication Distribution",
    description: "Dispense and monitor medications",
    tasks: [
      { id: "m1", name: "Verify patient identity", completed: false },
      { id: "m2", name: "Dispense prescribed meds", completed: false },
      { id: "m3", name: "Monitor for side effects", completed: false },
      { id: "m4", name: "Record administration time", completed: false },
    ],
  },
  hygiene: {
    icon: "🛁",
    title: "Personal Hygiene",
    description: "Assist with bathing and grooming",
    tasks: [
      { id: "h1", name: "Prepare bathing area", completed: false },
      { id: "h2", name: "Assist patient with shower/bath", completed: false },
      { id: "h3", name: "Change linens", completed: false },
      { id: "h4", name: "Assist with grooming", completed: false },
    ],
  },
  activity: {
    icon: "🏃",
    title: "Mobility & Activity",
    description: "Assist with movement and exercises",
    tasks: [
      { id: "a1", name: "Assist patient ambulation", completed: false },
      { id: "a2", name: "Range of motion exercises", completed: false },
      { id: "a3", name: "Fall prevention checks", completed: false },
      { id: "a4", name: "Position changes", completed: false },
    ],
  },
};

export default function CaretakerDashboard({ userEmail }) {
  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [checklists, setChecklists] = useState(CHECKLISTS);
  const [expandedChecklist, setExpandedChecklist] = useState("routine_rounds");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // Fetch all patients from backend
        const allPatients = await api.patients();
        
        // Find which caregiver ID matches this email
        const cgs = await api.caregivers();
        const me = cgs.find(c => c.name.toLowerCase().includes(userEmail.split("@")[0].toLowerCase()) || c.id === userEmail);
        
        if (allPatients && me) {
          // Filter patients assigned to this caregiver
          const myPatients = allPatients.filter(p => p.caregiver_id === me.id);
          
          // Map to match the dashboard's expected format
          const mapped = myPatients.map((p, i) => ({
            id: p.id,
            name: p.name,
            room: p.room,
            floor: p.floor,
            disease: p.disease?.replace("_", " "),
            priority: i === 0 ? "primary" : i === 1 ? "secondary" : "tertiary"
          }));
          setAssignments(mapped);
        } else {
          setAssignments([]);
        }
      } catch (e) {
        console.error("Failed to load assignments", e);
      }
    })();
  }, [userEmail]);

  // Fetch pre-existing active alarms on login
  useEffect(() => {
    (async () => {
      try {
        const cgs = await api.caregivers();
        const me = cgs.find(c => c.name.toLowerCase().includes(userEmail.split("@")[0].toLowerCase()) || c.id === userEmail);
        
        if (me) {
          const active = await api.activeAlarms();
          if (active) {
            // Only grab alarms where the current caretaker is primary
            const myAlarms = active.filter(a => a.primary_cg_id === me.id);
            if (myAlarms.length > 0) {
              setAlerts(myAlarms.map(a => ({
                ...a,
                timestamp: new Date(a.ts),
                severity: a.severity || "warning",
                priority: "primary"
              })));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch initial alarms", e);
      }
    })();
  }, [userEmail]);

  useEffect(() => {
    try {
      wsRef.current = createWS(
        (msg) => {
          console.log("📤 CaretakerDashboard received message:", msg);
          setConnected(true);
          if (msg.type === "caretaker_alert") {
            console.log(
              "🚨 Caretaker alert received for patient:",
              msg.alarm.patient_name,
            );
            setAlerts((prev) => [
              {
                ...msg.alarm,
                timestamp: new Date(),
                severity: msg.alarm.severity || "warning",
                priority: msg.priority,
              },
              ...prev.slice(0, 9),
            ]);
          }
          if (msg.type === "cancel_alert") {
            console.log("🚫 Canceling alert for patient id", msg.alarm_id);
            setAlerts((prev) => prev.filter((a) => a.id !== msg.alarm_id));
          }
          if (msg.type === "init") {
            console.log("✅ init message - CaretakerDashboard connected");
            setConnected(true);
          }
        },
        userEmail, // caretaker_id
        userEmail, // caretaker_email
      );
      wsRef.current.onopen = () => {
        console.log("✅ CaretakerDashboard WS opened for", userEmail);
        setConnected(true);
      };
      wsRef.current.onclose = () => {
        console.log("❌ CaretakerDashboard WS closed");
        setConnected(false);
      };
    } catch (e) {
      console.error("❌ Error creating WebSocket:", e);
    }
    return () => wsRef.current?.close();
  }, [userEmail]);

  const toggleTask = (checklistKey, taskId) => {
    setChecklists((prev) => {
      const updatedTasks = prev[checklistKey].tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      );
      const allDone = updatedTasks.every((t) => t.completed);
      if (allDone) {
        // Auto-advance to next checklist
        const keys = Object.keys(prev);
        const nextKey = keys[keys.indexOf(checklistKey) + 1];
        if (nextKey) setExpandedChecklist(nextKey);
      }
      return {
        ...prev,
        [checklistKey]: { ...prev[checklistKey], tasks: updatedTasks },
      };
    });
  };

  const checkedCount =
    Object.values(checklists)[
      expandedChecklist ? Object.keys(checklists).indexOf(expandedChecklist) : 0
    ]?.tasks?.filter((t) => t.completed).length || 0;
  const totalCount =
    Object.values(checklists)[
      expandedChecklist ? Object.keys(checklists).indexOf(expandedChecklist) : 0
    ]?.tasks?.length || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        fontFamily: "'Syne', sans-serif",
        color: "var(--text-main)",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 28px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 90,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
            👩‍⚕️ Caretaker Panel
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {userEmail}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connected ? "#2ed573" : "#ff4757",
                boxShadow: connected ? "0 0 8px #2ed573" : "0 0 8px #ff4757",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div className="grid-caretaker">
          {/* Main Content */}
          <div>
            {/* Active Alerts */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "var(--text-main)",
                  marginBottom: 14,
                }}
              >
                🚨 Active Alerts
              </div>
              {alerts.length === 0 ? (
                <Card style={{ padding: 30, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No active alerts at the moment
                  </p>
                </Card>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <Card
                    key={alert.id}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      borderLeft: `4px solid ${alert.severity === "critical" ? "#ff4757" : "#ffa502"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 4,
                          }}
                        >
                          {alert.patient_name} - Room {alert.room}
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                alert.priority === "primary"
                                  ? "#ff475730"
                                  : alert.priority === "secondary"
                                    ? "#ffa50230"
                                    : "#54a0ff30",
                              color:
                                alert.priority === "primary"
                                  ? "#ff4757"
                                  : alert.priority === "secondary"
                                    ? "#ffa502"
                                    : "#54a0ff",
                            }}
                          >
                            {alert.priority ? alert.priority.toUpperCase() : "ALERT"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {alert.type?.replace("_", " ").toUpperCase()} •{" "}
                          {alert.alarm_type || "Alert"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 4,
                          }}
                        >
                          {alert.timestamp?.toLocaleTimeString()}
                        </div>
                        {/* Display Backups as requested */}
                        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", padding: "6px 8px", background: "var(--bg-card-hover)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                          <div style={{fontWeight: 600, color: "var(--text-main)", marginBottom: 2}}>Backups on standby:</div>
                          {alert.secondary_cg_name && <div>• 2nd: {alert.secondary_cg_name}</div>}
                          {alert.tertiary_cg_name && <div>• 3rd: {alert.tertiary_cg_name}</div>}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexDirection: "column",
                        }}
                      >
                        <span
                          style={{
                            background:
                              alert.severity === "critical"
                                ? "#ff475750"
                                : "#ffa50250",
                            color:
                              alert.severity === "critical"
                                ? "#ff4757"
                                : "#ffa502",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {alert.severity || "WARNING"}
                        </span>
                        <button
                          onClick={async () => {
                            await api.caretakerAckAlarm(alert.id, userEmail);
                            setAlerts(prev => prev.filter(a => a.id !== alert.id));
                          }}
                          style={{
                            background: "#2ed573",
                            border: "none",
                            color: "#000",
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.background = "#3fe580")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "#2ed573")
                          }
                        >
                          ✓ Acknowledge
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Patient Assignments */}
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#dde4f0",
                  marginBottom: 14,
                }}
              >
                👥 Assigned Patients
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {assignments.map((patient) => (
                  <Card key={patient.id} style={{ padding: 16 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}
                    >
                      {patient.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Room {patient.room} • Floor {patient.floor}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          background:
                            patient.priority === "primary"
                              ? "#ff475750"
                              : patient.priority === "secondary"
                                ? "#ffa50250"
                                : "#3a456050",
                          color:
                            patient.priority === "primary"
                              ? "#ff4757"
                              : patient.priority === "secondary"
                                ? "#ffa502"
                                : "var(--text-muted)",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {patient.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {patient.disease}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Checklists */}
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "var(--text-main)",
                marginBottom: 14,
              }}
            >
              ✓ Today's Checklists
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(checklists).map(([key, checklist]) => {
                const completed = checklist.tasks.filter(
                  (t) => t.completed,
                ).length;
                const total = checklist.tasks.length;
                return (
                  <Card
                    key={key}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      background:
                        expandedChecklist === key ? "var(--bg-card-hover)" : "var(--bg-card)",
                      borderLeft: `3px solid ${completed === total ? "#2ed573" : "#ffa502"}`,
                    }}
                    onClick={() =>
                      setExpandedChecklist(
                        expandedChecklist === key ? null : key,
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "start",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          {checklist.icon} {checklist.title}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {completed}/{total} completed
                        </div>
                      </div>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: `conic-gradient(#2ed573 ${(completed / total) * 360}deg, var(--border-color) 0deg)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {completed}
                      </div>
                    </div>

                    {/* Expanded task list */}
                    {expandedChecklist === key && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px solid var(--border-color)",
                        }}
                      >
                        {checklist.tasks.map((task) => (
                          <div
                            key={task.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 0",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(key, task.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleTask(key, task.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: 16,
                                height: 16,
                                cursor: "pointer",
                                accentColor: "#2ed573",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: task.completed ? "var(--text-muted)" : "var(--text-main)",
                                textDecoration: task.completed
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
