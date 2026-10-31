import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CSV_REPORT_URL, PDF_REPORT_URL, getStats } from "../services/api";

function Reports() {
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getStats();
        if (stats && stats.total_detections !== undefined) {
          setTotalRecords(stats.total_detections);
        }
      } catch (err) {
        console.warn("Could not fetch detection stats:", err);
        const msg = err.message || "";
        if (
          msg.includes("Failed to fetch") ||
          msg.includes("server is not running")
        ) {
          setError("Backend server is not running. Please start Flask on port 5000.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadCSV = () => {
    window.open(CSV_REPORT_URL, "_blank");
  };

  const handleDownloadPDF = () => {
    window.open(PDF_REPORT_URL, "_blank");
  };

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

      <div style={{ marginTop: "20px" }}>
        <h1>📄 ANPR Detection Reports</h1>
        <p style={{ color: "#94a3b8" }}>
          Export comprehensive ANPR audit logs generated directly by Flask from SQLite history.
        </p>
      </div>

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

      <div
        className="watchlist-card"
        style={{
          marginTop: "25px",
          padding: "30px",
        }}
      >
        <h2>📥 Official System Reports</h2>
        <p style={{ color: "#94a3b8", margin: "10px 0 20px" }}>
          Total logged detection events in database:{" "}
          <strong style={{ color: "white", fontSize: "18px" }}>
            {loading ? "Loading..." : totalRecords}
          </strong>
        </p>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginTop: "15px" }}>
          <button
            onClick={handleDownloadCSV}
            style={{
              padding: "14px 24px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⬇️</span> Download CSV Report (GET /report/csv)
          </button>

          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "14px 24px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📄</span> Download PDF Report (GET /report/pdf)
          </button>
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "16px",
            background: "#081832",
            border: "1px solid #1e3a6d",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          <strong>Report Features:</strong>
          <ul style={{ marginLeft: "20px", marginTop: "8px", lineHeight: "1.6" }}>
            <li>Complete historical timestamps, recognized plate numbers, OCR confidence ratings.</li>
            <li>Plate quality metrics, recognition status, and alert flags.</li>
            <li>GPS latitude and longitude coordinates and location plaza names.</li>
            <li>Watchlist matching alerts and repeated vehicle detection counts.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Reports;