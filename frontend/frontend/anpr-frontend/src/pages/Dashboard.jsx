import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, getHistory } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    recognized: 0,
    lowConfidence: 0,
    watchlist: 0,
    repeated: 0,
  });
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsData, historyData] = await Promise.all([
        getStats(),
        getHistory(),
      ]);

      if (statsData) {
        setStats({
          total: statsData.total_detections || 0,
          recognized: statsData.recognized || 0,
          lowConfidence: statsData.low_confidence || 0,
          watchlist: statsData.watchlist_matches || 0,
          repeated: statsData.repeated_detections || 0,
        });
      }

      if (Array.isArray(historyData)) {
        setRecentDetections(historyData.slice(0, 7));
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("server is not running")
      ) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setError(msg || "Could not load statistics from backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      {/* NAVIGATION */}
      <nav className="dashboard-nav">
        <Link to="/dashboard">🏠 Dashboard</Link>
        <Link to="/vehicle-detection">📹 Vehicle Detection</Link>
        <Link to="/vehicle-records">🔎 Detection History</Link>
        <Link to="/analytics">📊 Analytics</Link>
        <Link to="/watchlist">🚨 Watchlist</Link>
        <Link to="/reports">📄 Reports</Link>
        <Link to="/location">🗺️ Map</Link>
      </nav>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <div>
          <h1>🚦 ANPR Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            Real-time rural toll plaza monitoring system backed by YOLO + EasyOCR
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div
          style={{
            margin: "20px 0",
            padding: "16px",
            background: "#4a1720",
            border: "1px solid #8b3040",
            borderRadius: "10px",
            color: "#ffb4be",
          }}
        >
          <strong>⚠️ {error}</strong>
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          margin: "25px 0",
        }}
      >
        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Total Detections</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px" }}>{stats.total}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Recognized</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#6ee7b7" }}>{stats.recognized}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Low Confidence</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#fcd34d" }}>{stats.lowConfidence}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Watchlist Alerts</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#f87171" }}>{stats.watchlist}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Repeated Vehicles</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#60a5fa" }}>{stats.repeated}</h2>
        </div>
      </div>

      {/* RECENT DETECTIONS FROM SQLITE DATABASE */}
      <div className="watchlist-card" style={{ marginTop: "25px" }}>
        <h2>🕒 Recent ANPR Detections (Live Database)</h2>

        {loading ? (
          <p style={{ padding: "20px 0", color: "#94a3b8" }}>Loading records from backend...</p>
        ) : recentDetections.length === 0 ? (
          <p style={{ padding: "20px 0", color: "#94a3b8" }}>No detections available in the database yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Alert</th>
                  <th>Detection Time</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong style={{ letterSpacing: "1px" }}>{record.plate_number || "--"}</strong>
                    </td>
                    <td>
                      {record.ocr_confidence !== undefined && record.ocr_confidence !== null
                        ? `${record.ocr_confidence}%`
                        : "--"}
                    </td>
                    <td>
                      <span
                        style={{
                          color: record.status === "Recognized" ? "#6ee7b7" : "#fcd34d",
                          fontWeight: "600",
                        }}
                      >
                        {record.status || "--"}
                      </span>
                    </td>
                    <td>
                      {record.watchlist_match ? (
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>🚨 WATCHLIST</span>
                      ) : record.alert && record.alert !== "None" ? (
                        <span style={{ color: "#fcd34d" }}>{record.alert}</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>None</span>
                      )}
                    </td>
                    <td>{record.detection_time || "--"}</td>
                    <td>{record.location || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "25px",
        }}
      >
        <Link to="/vehicle-detection">
          <button style={{ padding: "12px 20px", background: "#2563eb", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            📹 Start ANPR Detection
          </button>
        </Link>
        <Link to="/vehicle-records">
          <button style={{ padding: "12px 20px", background: "#334155", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            🔎 View Full History
          </button>
        </Link>
        <Link to="/location">
          <button style={{ padding: "12px 20px", background: "#334155", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            🗺️ Open Live Map
          </button>
        </Link>
        <Link to="/analytics">
          <button style={{ padding: "12px 20px", background: "#334155", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            📊 View Analytics
          </button>
        </Link>
        <Link to="/reports">
          <button style={{ padding: "12px 20px", background: "#334155", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
            📄 Download Reports
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;