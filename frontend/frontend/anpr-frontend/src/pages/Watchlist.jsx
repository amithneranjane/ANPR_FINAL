import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getWatchlist,
  addToWatchlist,
  deleteFromWatchlist,
} from "../services/api";

function Watchlist() {
  const [plate, setPlate] = useState("");
  const [reason, setReason] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWatchlist = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWatchlist();
      if (Array.isArray(data)) {
        setWatchlist(data);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("server is not running")
      ) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setError(msg || "Could not load watchlist.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const addPlate = async (e) => {
    e?.preventDefault?.();
    const value = plate.trim().toUpperCase();

    if (!value) {
      alert("Please enter a number plate.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await addToWatchlist(value, reason.trim() || "Flagged in watchlist");
      setSuccess(`Plate ${value} added to watchlist successfully!`);
      setPlate("");
      setReason("");
      loadWatchlist();
    } catch (err) {
      setError(err.message || "Failed to add plate to watchlist");
    }
  };

  const removePlate = async (plateNumber) => {
    if (!window.confirm(`Remove plate ${plateNumber} from watchlist?`)) return;

    try {
      setError("");
      setSuccess("");
      await deleteFromWatchlist(plateNumber);
      setSuccess(`Plate ${plateNumber} removed from watchlist.`);
      loadWatchlist();
    } catch (err) {
      setError(err.message || "Failed to remove plate from watchlist");
    }
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <div>
          <h1>🚨 Watchlist / Blacklist Management</h1>
          <p style={{ color: "#94a3b8" }}>
            Flagged number plates monitored automatically during ANPR detection.
          </p>
        </div>
        <button
          onClick={loadWatchlist}
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

      {/* NOTIFICATIONS */}
      {error && (
        <div
          style={{
            margin: "20px 0",
            padding: "14px",
            borderRadius: "8px",
            background: "#4a1720",
            border: "1px solid #8b3040",
            color: "#ffb4be",
          }}
        >
          <strong>⚠️ {error}</strong>
        </div>
      )}

      {success && (
        <div
          style={{
            margin: "20px 0",
            padding: "14px",
            borderRadius: "8px",
            background: "#064e3b",
            border: "1px solid #10b981",
            color: "#a7f3d0",
          }}
        >
          <strong>✅ {success}</strong>
        </div>
      )}

      {/* ADD TO WATCHLIST FORM */}
      <form
        onSubmit={addPlate}
        style={{
          display: "flex",
          gap: "10px",
          margin: "25px 0",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Enter number plate (e.g. MH47TC0964)"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          style={{
            padding: "12px",
            minWidth: "250px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "8px",
          }}
        />

        <input
          type="text"
          placeholder="Reason (e.g. Security Alert, Stolen vehicle)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            padding: "12px",
            minWidth: "300px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "8px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px 22px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Add to Watchlist
        </button>
      </form>

      {/* WATCHLIST TABLE */}
      <div className="watchlist-card">
        <h2>🚨 Flagged Number Plates in SQLite Database ({watchlist.length})</h2>

        {loading ? (
          <p style={{ color: "#94a3b8", padding: "20px 0" }}>Loading watchlist records...</p>
        ) : watchlist.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: "20px 0" }}>No plates currently in watchlist.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table>
              <thead>
                <tr>
                  <th>Number Plate</th>
                  <th>Flagged Reason</th>
                  <th>Added Time</th>
                  <th>Watchlist Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.id || item.plate_number}>
                    <td>
                      <strong style={{ letterSpacing: "1px", fontSize: "16px" }}>
                        {item.plate_number}
                      </strong>
                    </td>

                    <td>{item.reason || "Watchlist vehicle"}</td>

                    <td>{item.added_time || "--"}</td>

                    <td>
                      <span className="watchlist-badge" style={{ background: "#7f1d1d", color: "#fca5a5" }}>
                        WATCHLIST
                      </span>
                    </td>

                    <td>
                      <button
                        onClick={() => removePlate(item.plate_number)}
                        style={{
                          padding: "8px 14px",
                          background: "#334155",
                          border: "1px solid #475569",
                          color: "white",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
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

export default Watchlist;