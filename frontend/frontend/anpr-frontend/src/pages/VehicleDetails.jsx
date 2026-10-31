import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getVehicle,
  getVehicles,
  addVehicle,
  deleteVehicle,
} from "../services/api";

function VehicleDetails() {
  const { state } = useLocation();
  const result = state || {};
  const initialPlate = result.plate_number && result.plate_number !== "--" ? result.plate_number : "";

  const [searchPlate, setSearchPlate] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [ownerData, setOwnerData] = useState(result.vehicle_details || null);
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state to add/update vehicle owner
  const [newPlate, setNewPlate] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newStatus, setNewStatus] = useState("Active");
  const [newNotes, setNewNotes] = useState("");

  const loadAllVehicles = async () => {
    try {
      const data = await getVehicles();
      if (Array.isArray(data)) {
        setVehicleList(data);
      }
    } catch (err) {
      console.warn("Failed to fetch vehicles list:", err);
    }
  };

  const lookupPlate = async (plate) => {
    if (!plate || plate === "--" || plate === "Not Recognized") {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await getVehicle(plate);
      setOwnerData(data);
      setActivePlate(plate);
    } catch (err) {
      console.error("Lookup error:", err);
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("server is not running")) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setOwnerData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllVehicles();
    if (initialPlate) {
      lookupPlate(initialPlate);
    }
  }, [initialPlate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchPlate.trim()) {
      lookupPlate(searchPlate.trim().toUpperCase());
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const cleanPlate = newPlate.trim().toUpperCase();
    if (!cleanPlate) {
      alert("Please provide a valid plate number.");
      return;
    }
    if (!newOwner.trim()) {
      alert("Please provide owner name.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await addVehicle({
        plate_number: cleanPlate,
        owner_name: newOwner.trim(),
        registration_status: newStatus,
        notes: newNotes.trim() || "Registered owner",
      });
      setSuccess(`Vehicle record for ${cleanPlate} added successfully!`);
      setNewPlate("");
      setNewOwner("");
      setNewNotes("");
      loadAllVehicles();
      lookupPlate(cleanPlate);
    } catch (err) {
      setError(err.message || "Failed to add vehicle");
    }
  };

  const handleDeleteVehicle = async (plate) => {
    if (!window.confirm(`Delete owner record for plate ${plate}?`)) return;
    try {
      await deleteVehicle(plate);
      setSuccess(`Vehicle ${plate} removed.`);
      if (activePlate === plate) {
        setOwnerData(null);
      }
      loadAllVehicles();
    } catch (err) {
      setError(err.message || "Failed to delete vehicle record");
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

      <div style={{ marginTop: "20px" }}>
        <h1>👤 Vehicle & Owner Details</h1>
        <p style={{ color: "#94a3b8" }}>
          Registered vehicle owner information and enforcement records.
        </p>
      </div>

      {/* SEARCH VEHICLE */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: "flex",
          gap: "10px",
          margin: "25px 0",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Lookup plate number (e.g. MH47TC0964)..."
          value={searchPlate}
          onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
          style={{
            padding: "12px",
            minWidth: "260px",
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
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔍 Search Record
        </button>
      </form>

      {/* NOTIFICATIONS */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
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
            marginBottom: "20px",
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

      {/* SELECTED PLATE DETAILS */}
      <div className="result-box">
        <p>Active Plate Number</p>
        <h1 style={{ letterSpacing: "2px", margin: "10px 0" }}>
          {activePlate || "No Plate Selected"}
        </h1>
      </div>

      {/* OWNER INFORMATION CARD */}
      {loading ? (
        <div className="watchlist-card">Loading owner details...</div>
      ) : ownerData ? (
        <div className="watchlist-card" style={{ marginBottom: "25px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>👤 Owner Information</h2>
            <button
              onClick={() => handleDeleteVehicle(ownerData.plate_number)}
              style={{
                background: "#7f1d1d",
                color: "#fee2e2",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Delete Record
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "18px",
            }}
          >
            <div style={{ background: "#0d1b33", padding: "16px", borderRadius: "8px" }}>
              <span style={{ color: "#94a3b8", fontSize: "13px", display: "block" }}>Owner Name</span>
              <strong style={{ fontSize: "18px" }}>{ownerData.owner_name || "N/A"}</strong>
            </div>

            <div style={{ background: "#0d1b33", padding: "16px", borderRadius: "8px" }}>
              <span style={{ color: "#94a3b8", fontSize: "13px", display: "block" }}>Registration Status</span>
              <strong
                style={{
                  fontSize: "18px",
                  color: ownerData.registration_status === "Active" ? "#6ee7b7" : "#fcd34d",
                }}
              >
                {ownerData.registration_status || "Active"}
              </strong>
            </div>

            <div style={{ background: "#0d1b33", padding: "16px", borderRadius: "8px" }}>
              <span style={{ color: "#94a3b8", fontSize: "13px", display: "block" }}>Notes / Record Info</span>
              <strong style={{ fontSize: "16px" }}>{ownerData.notes || "None"}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            margin: "25px 0",
            padding: "25px",
            borderRadius: "12px",
            background: "#1e293b",
            color: "#cbd5e1",
          }}
        >
          <h3>Owner Information Not Found in Database</h3>
          <p style={{ marginTop: "6px", color: "#94a3b8" }}>
            No registered owner record was found for plate <strong>{activePlate || "N/A"}</strong> in the backend SQLite database.
            You can register this vehicle below.
          </p>
        </div>
      )}

      {/* DETECTION CONTEXT IF COMING FROM DETECTION */}
      {result.detection_time && (
        <div className="watchlist-card" style={{ marginBottom: "25px" }}>
          <h2>🕒 Associated Detection Session</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            <div>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "block" }}>OCR Confidence</span>
              <strong>{result.ocr_confidence ?? "--"}%</strong>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "block" }}>Plate Quality</span>
              <strong>{result.plate_quality || "--"}</strong>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "block" }}>Detection Status</span>
              <strong>{result.status || "--"}</strong>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "block" }}>Detection Time</span>
              <strong>{result.detection_time || "--"}</strong>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "block" }}>Location</span>
              <strong>{result.location || "--"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / ADD VEHICLE FORM */}
      <div className="watchlist-card" style={{ marginBottom: "25px" }}>
        <h2>➕ Register / Update Vehicle Owner Details</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
          Add or update owner records in the backend database.
        </p>

        <form
          onSubmit={handleAddVehicle}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
              Plate Number *
            </label>
            <input
              type="text"
              placeholder="e.g. MH47TC0964"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: "10px",
                background: "#081832",
                border: "1px solid #304b79",
                color: "white",
                borderRadius: "6px",
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
              Owner Name *
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#081832",
                border: "1px solid #304b79",
                color: "white",
                borderRadius: "6px",
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
              Registration Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#081832",
                border: "1px solid #304b79",
                color: "white",
                borderRadius: "6px",
              }}
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
              Notes / Record Info
            </label>
            <input
              type="text"
              placeholder="Additional notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#081832",
                border: "1px solid #304b79",
                color: "white",
                borderRadius: "6px",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              💾 Save Vehicle Record
            </button>
          </div>
        </form>
      </div>

      {/* ALL REGISTERED VEHICLES TABLE */}
      <div className="watchlist-card">
        <h2>📋 All Registered Vehicles in Database ({vehicleList.length})</h2>
        {vehicleList.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: "15px 0" }}>
            No registered vehicles found in the backend database.
          </p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Owner Name</th>
                  <th>Registration Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicleList.map((veh) => (
                  <tr key={veh.id || veh.plate_number}>
                    <td>
                      <strong style={{ letterSpacing: "1px" }}>{veh.plate_number}</strong>
                    </td>
                    <td>{veh.owner_name}</td>
                    <td>
                      <span
                        style={{
                          color: veh.registration_status === "Active" ? "#6ee7b7" : "#fcd34d",
                          fontWeight: "600",
                        }}
                      >
                        {veh.registration_status || "Active"}
                      </span>
                    </td>
                    <td>{veh.notes || "--"}</td>
                    <td>
                      <button
                        onClick={() => lookupPlate(veh.plate_number)}
                        style={{
                          padding: "6px 12px",
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "8px",
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(veh.plate_number)}
                        style={{
                          padding: "6px 12px",
                          background: "#7f1d1d",
                          color: "#fee2e2",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
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

export default VehicleDetails;