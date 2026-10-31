import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { getMapDetections } from "../services/api";

// Fix standard Leaflet asset resolution for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position && Array.isArray(position) && position[0] && position[1]) {
      map.setView(position, 13);
    }
  }, [position, map]);

  return null;
}

function LocationMap() {
  const [userPosition, setUserPosition] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  // 1. Request browser GPS permission
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        setUserPosition([
          location.coords.latitude,
          location.coords.longitude,
        ]);
      },
      () => {
        setGpsError("Location permission denied or unavailable.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // 2. Fetch real ANPR detection coordinates from Flask backend
  const loadDetections = async () => {
    setLoading(true);
    setBackendError("");
    try {
      const data = await getMapDetections();
      if (Array.isArray(data)) {
        const validCoords = data.filter(
          (d) =>
            d.latitude !== null &&
            d.latitude !== undefined &&
            !isNaN(Number(d.latitude)) &&
            d.longitude !== null &&
            d.longitude !== undefined &&
            !isNaN(Number(d.longitude))
        );
        setDetections(validCoords);
      }
    } catch (err) {
      console.error("Failed to load map detections:", err);
      const msg = err.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("server is not running")
      ) {
        setBackendError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setBackendError(msg || "Could not load map detections.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetections();
  }, []);

  // Center map around user GPS if available, otherwise first detection point, otherwise India center
  const initialCenter = userPosition
    ? userPosition
    : detections.length > 0
    ? [Number(detections[0].latitude), Number(detections[0].longitude)]
    : [12.9716, 77.5946];

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
          <h1>🗺️ ANPR Live Geolocation Map</h1>
          <p style={{ color: "#94a3b8" }}>
            Real-time geospatial visualization of detected vehicles across monitored plazas.
          </p>
        </div>
        <button
          onClick={loadDetections}
          style={{
            padding: "8px 16px",
            background: "#1e293b",
            border: "1px solid #475569",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh Markers
        </button>
      </div>

      {/* STATUS / ERRORS */}
      {backendError && (
        <div
          style={{
            margin: "20px 0",
            padding: "14px",
            background: "#4a1720",
            border: "1px solid #8b3040",
            borderRadius: "8px",
            color: "#ffb4be",
          }}
        >
          <strong>⚠️ {backendError}</strong>
        </div>
      )}

      {gpsError && (
        <p style={{ color: "#fcd34d", marginTop: "10px", fontSize: "14px" }}>
          ⚠️ GPS Notice: {gpsError}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "15px",
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        <span>
          📍 Current GPS:{" "}
          <strong style={{ color: userPosition ? "#6ee7b7" : "#cbd5e1" }}>
            {userPosition
              ? `${userPosition[0].toFixed(5)}, ${userPosition[1].toFixed(5)}`
              : "Acquiring..."}
          </strong>
        </span>
        <span>
          🚗 Active Detection Markers:{" "}
          <strong style={{ color: "white" }}>
            {loading ? "Loading..." : detections.length}
          </strong>
        </span>
      </div>

      {/* MAP CONTAINER */}
      <div
        style={{
          height: "560px",
          width: "100%",
          borderRadius: "14px",
          overflow: "hidden",
          marginTop: "20px",
          border: "1px solid #334155",
        }}
      >
        <MapContainer
          center={initialCenter}
          zoom={userPosition ? 13 : 8}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userPosition && <MapCenter position={userPosition} />}

          {/* User's Current GPS Location */}
          {userPosition && (
            <Marker position={userPosition}>
              <Popup>
                <div style={{ color: "#111827", padding: "4px" }}>
                  <strong style={{ fontSize: "14px" }}>📍 Your Current Location</strong>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Lat: {userPosition[0].toFixed(6)}
                    <br />
                    Lng: {userPosition[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Real Backend ANPR Detection Markers */}
          {detections.map((detection) => (
            <Marker
              key={detection.id}
              position={[Number(detection.latitude), Number(detection.longitude)]}
            >
              <Popup>
                <div style={{ color: "#111827", minWidth: "180px", padding: "4px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "15px",
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "4px",
                      marginBottom: "6px",
                    }}
                  >
                    🚗 Plate: {detection.plate_number || "--"}
                  </div>

                  <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                    <div>
                      <strong>Confidence:</strong> {detection.ocr_confidence ?? "--"}%
                    </div>
                    <div>
                      <strong>Status:</strong> {detection.status || "--"}
                    </div>
                    <div>
                      <strong>Detection Time:</strong> {detection.detection_time || "--"}
                    </div>
                    <div>
                      <strong>Location:</strong> {detection.location || "--"}
                    </div>
                    {detection.alert && detection.alert !== "None" && (
                      <div style={{ color: "#dc2626", fontWeight: "bold", marginTop: "4px" }}>
                        🚨 {detection.alert}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default LocationMap;