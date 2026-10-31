import { Link, useLocation } from "react-router-dom";
import { getEvidenceImageUrl } from "../services/api";

function RecognitionResult() {
  const location = useLocation();
  const data = location.state || {};

  const plateNumber = data.plate_number || "--";
  const confidence = data.ocr_confidence ?? "--";
  const plateQuality = data.plate_quality || "--";
  const status = data.status || "--";
  const bestMethod = data.best_method || "--";
  const previousDetections = data.previous_detections ?? 0;
  const detectionTime = data.detection_time || "--";
  const detectionLocation = data.location || "--";
  const alertText = data.alert || "None";
  const isWatchlist = Boolean(data.watchlist_match);
  const watchlistReason = data.watchlist_reason || "";
  const vehicleDetails = data.vehicle_details;

  // Low-resolution plate warning condition
  const qualityStr = String(plateQuality).toLowerCase().trim();
  const isLowResolution =
    qualityStr.includes("poor") ||
    qualityStr.includes("low") ||
    status === "Low Confidence" ||
    (typeof confidence === "number" && confidence < 50);

  const originalImgUrl = getEvidenceImageUrl(data.original_image);
  const plateImgUrl = getEvidenceImageUrl(data.plate_image);

  return (
    <div style={pageStyle}>
      {/* NAVIGATION */}
      <nav style={navStyle}>
        <Link to="/dashboard" style={linkStyle}>
          🏠 Dashboard
        </Link>
        <Link to="/vehicle-detection" style={linkStyle}>
          📹 Vehicle Detection
        </Link>
        <Link to="/vehicle-records" style={linkStyle}>
          🔎 Detection History
        </Link>
        <Link to="/location" style={linkStyle}>
          🗺️ Map
        </Link>
        <Link to="/analytics" style={linkStyle}>
          📊 Analytics
        </Link>
        <Link to="/watchlist" style={linkStyle}>
          🚨 Watchlist
        </Link>
        <Link to="/reports" style={linkStyle}>
          📄 Reports
        </Link>
      </nav>

      <main style={mainStyle}>
        <h1>🔎 Number Plate Recognition Result</h1>
        <p style={subtitleStyle}>
          Actual YOLO detection & EasyOCR results from Flask backend
        </p>

        {/* WATCHLIST ALERT (ONLY IF REAL MATCH) */}
        {isWatchlist ? (
          <div style={watchlistBannerStyle}>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
              🚨 WATCHLIST MATCH
            </div>
            <div style={{ fontSize: "16px" }}>
              <strong>Watchlist Reason:</strong> {watchlistReason || "Flagged in enforcement database"}
            </div>
          </div>
        ) : (
          <div style={normalStatusStyle}>
            <span>✅ Watchlist Status: </span>
            <strong style={{ color: "#4ade80" }}>Clear (No Watchlist Match)</strong>
          </div>
        )}

        {/* LOW-RESOLUTION WARNING */}
        {isLowResolution && (
          <div style={warningStyle}>
            ⚠️ Low-resolution plate – Manual verification recommended.
          </div>
        )}

        {/* EVIDENCE IMAGES: ORIGINAL + CROPPED PLATE */}
        <div style={evidenceGridStyle}>
          {originalImgUrl && (
            <div style={cardStyle}>
              <h3>📷 Original Evidence Image</h3>
              <img
                src={originalImgUrl}
                alt="Detected vehicle evidence"
                style={imageStyle}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          {plateImgUrl && (
            <div style={cardStyle}>
              <h3>🔍 Cropped Plate Image</h3>
              <img
                src={plateImgUrl}
                alt="Cropped number plate evidence"
                style={{
                  ...imageStyle,
                  maxHeight: "150px",
                  objectFit: "contain",
                  background: "#081832",
                  padding: "10px",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* RECOGNITION DETAILS GRID */}
        <div style={gridStyle}>
          {/* PLATE CARD */}
          <div style={cardStyle}>
            <h2>Number Plate</h2>
            <div style={plateStyle}>{plateNumber}</div>

            <p style={detailItemStyle}>
              <strong>OCR Confidence:</strong>{" "}
              <span style={{ color: typeof confidence === "number" && confidence >= 70 ? "#4ade80" : "#facc15" }}>
                {confidence}
                {confidence !== "--" ? "%" : ""}
              </span>
            </p>

            <p style={detailItemStyle}>
              <strong>Plate Quality:</strong> {plateQuality}
            </p>

            <p style={detailItemStyle}>
              <strong>Status:</strong>{" "}
              <span style={{ color: status === "Recognized" ? "#4ade80" : "#f87171" }}>
                {status}
              </span>
            </p>

            <p style={detailItemStyle}>
              <strong>Alert:</strong> {alertText}
            </p>
          </div>

          {/* DETECTION INFO CARD */}
          <div style={cardStyle}>
            <h2>Detection Information</h2>

            <p style={detailItemStyle}>
              <strong>Best OCR Method:</strong> {bestMethod}
            </p>

            <p style={detailItemStyle}>
              <strong>Previous Detections:</strong> {previousDetections}
            </p>

            <p style={detailItemStyle}>
              <strong>Detection Time:</strong> {detectionTime}
            </p>

            <p style={detailItemStyle}>
              <strong>Location:</strong> {detectionLocation}
            </p>

            {data.latitude && data.longitude && (
              <p style={detailItemStyle}>
                <strong>GPS Coordinates:</strong>{" "}
                {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* OWNER / VEHICLE DETAILS (NO VEHICLE TYPE DISPLAYED) */}
        {vehicleDetails && (
          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <h2>👤 Registered Owner Information</h2>
            <div style={detailsGridStyle}>
              <div style={detailBoxStyle}>
                <span style={labelStyle}>Owner Name</span>
                <strong>{vehicleDetails.owner_name || "N/A"}</strong>
              </div>
              <div style={detailBoxStyle}>
                <span style={labelStyle}>Registration Status</span>
                <strong>{vehicleDetails.registration_status || "Active"}</strong>
              </div>
              <div style={detailBoxStyle}>
                <span style={labelStyle}>Notes</span>
                <strong>{vehicleDetails.notes || "None"}</strong>
              </div>
            </div>
          </div>
        )}

        {/* REPEATED DETECTION NOTICE */}
        {previousDetections > 0 && (
          <div style={infoStyle}>
            🔁 This vehicle has been detected <strong>{previousDetections}</strong> previous time(s) at monitored plazas.
          </div>
        )}

        {/* BUTTON ACTIONS */}
        <div style={buttonContainerStyle}>
          <Link to="/vehicle-details" state={data} style={buttonStyle}>
            👤 Full Vehicle Details
          </Link>
          <Link to="/vehicle-records" style={buttonStyle}>
            📋 Detection History
          </Link>
          <Link to="/location" style={buttonStyle}>
            🗺️ View on Map
          </Link>
          <Link to="/vehicle-detection" style={buttonSecondaryStyle}>
            📹 Detect Another Image
          </Link>
          <Link to="/dashboard" style={buttonSecondaryStyle}>
            🏠 Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0b132b",
  color: "white",
};

const navStyle = {
  display: "flex",
  gap: "25px",
  padding: "20px 35px",
  background: "#1c2942",
  flexWrap: "wrap",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
};

const mainStyle = {
  padding: "35px 40px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const subtitleStyle = {
  color: "#9aa7bd",
  marginBottom: "25px",
};

const watchlistBannerStyle = {
  background: "#7f1d1d",
  border: "2px solid #ef4444",
  color: "#fee2e2",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "25px",
  boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
};

const normalStatusStyle = {
  background: "#064e3b",
  border: "1px solid #10b981",
  color: "#a7f3d0",
  padding: "14px 20px",
  borderRadius: "10px",
  marginBottom: "20px",
  display: "inline-block",
};

const warningStyle = {
  background: "#4a3515",
  border: "1px solid #eab308",
  color: "#fef08a",
  padding: "16px 20px",
  borderRadius: "10px",
  marginBottom: "25px",
  fontSize: "15px",
  fontWeight: "600",
};

const infoStyle = {
  background: "#172f46",
  color: "#93c5fd",
  padding: "16px 20px",
  borderRadius: "10px",
  marginBottom: "25px",
  border: "1px solid #2563eb",
};

const evidenceGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
  marginBottom: "25px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "25px",
  marginBottom: "25px",
};

const cardStyle = {
  background: "#16213a",
  padding: "25px",
  borderRadius: "12px",
  border: "1px solid #263c67",
};

const plateStyle = {
  background: "#fef08a",
  color: "#000000",
  padding: "16px",
  borderRadius: "8px",
  fontSize: "32px",
  fontWeight: "900",
  letterSpacing: "3px",
  textAlign: "center",
  margin: "18px 0",
  border: "3px solid #000000",
  fontFamily: "monospace",
};

const imageStyle = {
  width: "100%",
  maxHeight: "350px",
  objectFit: "contain",
  display: "block",
  margin: "15px auto",
  borderRadius: "10px",
  border: "1px solid #304b79",
};

const detailItemStyle = {
  margin: "12px 0",
  fontSize: "15px",
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #233454",
  paddingBottom: "8px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
  marginTop: "15px",
};

const detailBoxStyle = {
  background: "#0d1b33",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #1e3a6d",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#94a3b8",
  marginBottom: "6px",
};

const buttonContainerStyle = {
  display: "flex",
  gap: "15px",
  flexWrap: "wrap",
  marginTop: "30px",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  textDecoration: "none",
  padding: "12px 22px",
  borderRadius: "8px",
  fontWeight: "600",
};

const buttonSecondaryStyle = {
  background: "#334155",
  color: "white",
  textDecoration: "none",
  padding: "12px 22px",
  borderRadius: "8px",
  fontWeight: "600",
};

export default RecognitionResult;