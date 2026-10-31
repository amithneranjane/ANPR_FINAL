import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../services/api";

function VehicleRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getHistory();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to load detection records:", err);
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("server is not running")
      ) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setError(msg || "Failed to load detection history.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const plateMatch =
        !search ||
        String(record.plate_number || "")
          .toUpperCase()
          .includes(search.toUpperCase());

      const statusMatch =
        statusFilter === "All" || record.status === statusFilter;

      const dateMatch =
        !dateFilter ||
        String(record.detection_time || "").startsWith(dateFilter);

      return plateMatch && statusMatch && dateMatch;
    });
  }, [records, search, statusFilter, dateFilter]);

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
          <h1>🔎 Detection History</h1>
          <p style={{ color: "#94a3b8" }}>
            View and search recorded ANPR detections from the SQLite database.
          </p>
        </div>
        <button
          onClick={loadHistory}
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

      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          margin: "25px 0",
        }}
      >
        <input
          type="text"
          placeholder="Search number plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "12px",
            minWidth: "230px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "8px",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "12px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "8px",
          }}
        >
          <option value="All">All Status</option>
          <option value="Recognized">Recognized</option>
          <option value="Low Confidence">Low Confidence</option>
          <option value="OCR Failed">OCR Failed</option>
          <option value="Detection Failed">Detection Failed</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: "12px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "8px",
          }}
        />

        <button
          onClick={() => {
            setSearch("");
            setStatusFilter("All");
            setDateFilter("");
          }}
          style={{
            padding: "12px 18px",
            background: "#334155",
            border: "none",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* RECORD COUNT */}
      <div
        style={{
          marginBottom: "15px",
          fontWeight: "600",
          color: "#94a3b8",
        }}
      >
        Showing {filteredRecords.length} of {records.length} total database records
      </div>

      {/* HISTORY TABLE */}
      <div className="watchlist-card">
        {loading ? (
          <div style={{ padding: "35px", textAlign: "center", color: "#94a3b8" }}>
            Loading records from database...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div
            style={{
              padding: "35px",
              textAlign: "center",
            }}
          >
            <h3>No detection records found</h3>
            <p style={{ color: "#94a3b8" }}>
              Successful ANPR detections will appear here once processed.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Number Plate</th>
                  <th>Confidence</th>
                  <th>Plate Quality</th>
                  <th>Status</th>
                  <th>Alert</th>
                  <th>Date / Time</th>
                  <th>Location</th>
                  <th>Previous</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong style={{ letterSpacing: "1px" }}>
                        {record.plate_number || "--"}
                      </strong>
                    </td>

                    <td>
                      {record.ocr_confidence !== undefined && record.ocr_confidence !== null
                        ? `${record.ocr_confidence}%`
                        : "--"}
                    </td>

                    <td>{record.plate_quality || "--"}</td>

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
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                          🚨 WATCHLIST
                        </span>
                      ) : record.alert && record.alert !== "None" ? (
                        <span style={{ color: "#fcd34d" }}>{record.alert}</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>No Alert</span>
                      )}
                    </td>

                    <td>{record.detection_time || "--"}</td>

                    <td>{record.location || "--"}</td>

                    <td>{record.previous_detections ?? 0}</td>

                    <td>
                      <Link
                        to="/vehicle-details"
                        state={record}
                        style={{
                          color: "#60a5fa",
                          textDecoration: "underline",
                          fontSize: "13px",
                        }}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleRecords;