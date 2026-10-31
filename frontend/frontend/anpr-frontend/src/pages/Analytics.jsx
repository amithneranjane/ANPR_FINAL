import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStats,
  getDailyAnalytics,
  getRepeatedAnalytics,
  getWatchlistAnalytics,
} from "../services/api";

function Analytics() {
  const [stats, setStats] = useState({
    total: 0,
    recognized: 0,
    lowConfidence: 0,
    failed: 0,
    watchlistMatches: 0,
    repeated: 0,
  });
  const [dailyData, setDailyData] = useState([]);
  const [repeatedData, setRepeatedData] = useState([]);
  const [watchlistData, setWatchlistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsRes, dailyRes, repeatedRes, watchlistRes] = await Promise.all([
        getStats(),
        getDailyAnalytics(),
        getRepeatedAnalytics(),
        getWatchlistAnalytics(),
      ]);

      if (statsRes) {
        setStats({
          total: statsRes.total_detections || 0,
          recognized: statsRes.recognized || 0,
          lowConfidence: statsRes.low_confidence || 0,
          failed: statsRes.failed || 0,
          watchlistMatches: statsRes.watchlist_matches || 0,
          repeated: statsRes.repeated_detections || 0,
        });
      }

      if (Array.isArray(dailyRes)) setDailyData(dailyRes);
      if (Array.isArray(repeatedRes)) setRepeatedData(repeatedRes);
      if (Array.isArray(watchlistRes)) setWatchlistData(watchlistRes);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("server is not running")
      ) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setError(msg || "Could not load analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const statusDistribution = [
    { name: "Recognized", value: stats.recognized, color: "#22c55e" },
    { name: "Low Confidence", value: stats.lowConfidence, color: "#f59e0b" },
    { name: "Failed / Unrecognized", value: stats.failed, color: "#ef4444" },
  ];

  const maxStatusValue = Math.max(
    ...statusDistribution.map((item) => item.value),
    1
  );

  return (
    <div className="page-container">
      {/* NAVIGATION */}
      <nav className="dashboard-nav">
        <Link to="/dashboard">🏠 Dashboard</Link>
        <Link to="/vehicle-detection">📹 Vehicle Detection</Link>
        <Link to="/vehicle-records">🔎 Detection History</Link>
        <Link to="/analytics">📊 Analytics</Link>
        <Link to="/watchlist">🚨 Watchlist</Link>
        <Link to="/location">🗺️ Map</Link>
        <Link to="/reports">📄 Reports</Link>
      </nav>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <div>
          <h1>📊 ANPR Analytics</h1>
          <p style={{ color: "#94a3b8" }}>
            Real-time analytics aggregated from SQLite detection history & Flask backend.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
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

      {/* SUMMARY CARDS */}
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
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Failed Detections</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#f87171" }}>{stats.failed}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Watchlist Matches</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#f87171" }}>{stats.watchlistMatches}</h2>
        </div>

        <div className="watchlist-card">
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Repeated Vehicles</p>
          <h2 style={{ fontSize: "28px", marginTop: "5px", color: "#60a5fa" }}>{stats.repeated}</h2>
        </div>
      </div>

      {/* STATUS DISTRIBUTION */}
      <div className="watchlist-card" style={{ marginBottom: "25px" }}>
        <h2>📈 Detection Status Distribution</h2>
        <div style={{ marginTop: "20px" }}>
          {statusDistribution.map((item) => (
            <div key={item.name} style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                <span>{item.name}</span>
                <strong>{item.value} ({stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0}%)</strong>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "18px",
                  background: "#081832",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #1e3a6d",
                }}
              >
                <div
                  style={{
                    width: `${(item.value / maxStatusValue) * 100}%`,
                    height: "100%",
                    background: item.color,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DAILY ANALYTICS TABLE */}
      <div className="watchlist-card" style={{ marginBottom: "25px" }}>
        <h2>📅 Daily Detection Trends (/analytics/daily)</h2>
        {dailyData.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: "15px 0" }}>No daily trends available yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Detections</th>
                  <th>Recognized</th>
                  <th>Low Confidence</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day) => (
                  <tr key={day.date}>
                    <td><strong>{day.date}</strong></td>
                    <td>{day.total}</td>
                    <td style={{ color: "#6ee7b7" }}>{day.recognized}</td>
                    <td style={{ color: "#fcd34d" }}>{day.low_confidence}</td>
                    <td style={{ color: "#f87171" }}>{day.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "25px" }}>
        {/* REPEATED DETECTIONS */}
        <div className="watchlist-card">
          <h2>🔁 Repeated Vehicles (/analytics/repeated)</h2>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>
            Vehicles detected more than once across monitored toll plazas.
          </p>
          {repeatedData.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "15px 0" }}>No repeated vehicles recorded.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "15px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Plate Number</th>
                    <th>Detection Count</th>
                    <th>Last Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {repeatedData.map((item) => (
                    <tr key={item.plate_number}>
                      <td><strong>{item.plate_number}</strong></td>
                      <td>
                        <span style={{ color: "#60a5fa", fontWeight: "bold" }}>
                          {item.detection_count} times
                        </span>
                      </td>
                      <td style={{ fontSize: "13px" }}>{item.last_detected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WATCHLIST MATCHES ANALYTICS */}
        <div className="watchlist-card">
          <h2>🚨 Watchlist Match Frequency (/analytics/watchlist)</h2>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>
            Enforcement frequency for watchlist flagged number plates.
          </p>
          {watchlistData.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "15px 0" }}>No watchlist matches recorded.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "15px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Plate Number</th>
                    <th>Match Count</th>
                    <th>Last Intercepted</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistData.map((item) => (
                    <tr key={item.plate_number}>
                      <td><strong style={{ color: "#f87171" }}>{item.plate_number}</strong></td>
                      <td>
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                          {item.match_count} times
                        </span>
                      </td>
                      <td style={{ fontSize: "13px" }}>{item.last_detected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;