import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { recognizePlate } from "../services/api";

function LiveANPR() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationName, setLocationName] = useState("Rural Toll Plaza");
  const [gpsCoords, setGpsCoords] = useState({ latitude: null, longitude: null });
  const [gpsStatus, setGpsStatus] = useState("Requesting GPS...");

  // Request browser geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ latitude: lat, longitude: lng });
        setGpsStatus(`GPS Active (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      },
      (err) => {
        console.warn("Geolocation permission denied or unavailable:", err.message);
        setGpsStatus("GPS permission denied / unavailable (default location will be used)");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Handle image selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG).");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create image preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // Detect number plate using Flask backend
  const handleDetect = async () => {
    if (!selectedFile) {
      setError("Please select a vehicle image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send image and GPS details to Flask backend: POST http://127.0.0.1:5000/predict
      const result = await recognizePlate(selectedFile, {
        latitude: gpsCoords.latitude,
        longitude: gpsCoords.longitude,
        location: locationName || "Rural Toll Plaza",
      });

      setLoading(false);

      // Navigate to Recognition Result page with actual backend response
      navigate("/recognition-result", {
        state: result,
      });
    } catch (err) {
      setLoading(false);
      console.error("ANPR detection failed:", err);
      const msg = err.message || "Failed to process image";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("server is not running")
      ) {
        setError("Backend server is not running. Please start Flask on port 5000.");
      } else {
        setError(msg);
      }
    }
  };

  // Clear selected image
  const handleClear = () => {
    setSelectedFile(null);
    setImagePreview("");
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06132b",
        color: "white",
        paddingBottom: "50px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          background: "#0b1b3b",
          borderBottom: "1px solid #20345c",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          ANPR
        </div>

        {/* NAVIGATION */}
        <nav
          style={{
            display: "flex",
            gap: "25px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/dashboard"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Dashboard
          </Link>

          <Link
            to="/vehicle-detection"
            style={{
              color: "#60a5fa",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Live ANPR
          </Link>

          <Link
            to="/vehicle-records"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Vehicle Records
          </Link>

          <Link
            to="/analytics"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Analytics
          </Link>

          <Link
            to="/watchlist"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Watchlist
          </Link>

          <Link
            to="/location"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Map
          </Link>

          <Link
            to="/reports"
            style={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Reports
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "45px 25px",
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "34px",
            marginBottom: "10px",
          }}
        >
          Live ANPR Detection
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#9caac5",
            marginBottom: "35px",
          }}
        >
          Upload a vehicle image to detect number plate with YOLO + EasyOCR in real time.
        </p>

        {/* GPS STATUS BAR */}
        <div
          style={{
            background: "#0d2248",
            border: "1px solid #1e3a6d",
            borderRadius: "12px",
            padding: "14px 20px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <div>
            <strong>📍 GPS Location:</strong>{" "}
            <span style={{ color: gpsCoords.latitude ? "#6ee7b7" : "#fcd34d" }}>
              {gpsStatus}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ color: "#9caac5" }}>Plaza Name:</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Rural Toll Plaza"
              style={{
                background: "#081832",
                border: "1px solid #304b79",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* UPLOAD CARD */}
        <div
          style={{
            background: "#0b1b3b",
            border: "1px solid #263c67",
            borderRadius: "18px",
            padding: "35px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* UPLOAD AREA */}
          <div
            style={{
              border: "2px dashed #42628f",
              borderRadius: "15px",
              padding: "35px",
              textAlign: "center",
              background: "#081832",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Upload Vehicle Image
            </h2>

            <p
              style={{
                color: "#9caac5",
                marginBottom: "25px",
              }}
            >
              Select a JPG, JPEG or PNG vehicle image.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              style={{
                color: "white",
                marginBottom: "20px",
              }}
            />
          </div>

          {/* IMAGE PREVIEW */}
          {imagePreview && (
            <div
              style={{
                marginTop: "30px",
                textAlign: "center",
              }}
            >
              <h3>Selected Image</h3>

              <img
                src={imagePreview}
                alt="Selected vehicle"
                style={{
                  maxWidth: "100%",
                  maxHeight: "450px",
                  objectFit: "contain",
                  borderRadius: "12px",
                  border: "1px solid #304b79",
                  marginTop: "10px",
                }}
              />
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                borderRadius: "12px",
                background: "#0f2b5c",
                border: "1px solid #2563eb",
                color: "#93c5fd",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "4px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#60a5fa",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ fontSize: "16px", fontWeight: "600" }}>
                Processing with YOLO & EasyOCR...
              </div>
              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                Detecting plate bounding box, cropping, image preprocessing, and multi-method OCR recognition.
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: "10px",
                background: "#4a1720",
                border: "1px solid #8b3040",
                color: "#ffb4be",
                textAlign: "center",
                fontSize: "15px",
                lineHeight: "1.5",
              }}
            >
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* DETECT BUTTON */}
            <button
              onClick={handleDetect}
              disabled={!selectedFile || loading}
              style={{
                padding: "14px 32px",
                borderRadius: "10px",
                border: "none",
                background:
                  !selectedFile || loading
                    ? "#475569"
                    : "#2563eb",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  !selectedFile || loading
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Processing..." : "Detect Number Plate"}
            </button>

            {/* CLEAR BUTTON */}
            {imagePreview && (
              <button
                onClick={handleClear}
                disabled={loading}
                style={{
                  padding: "14px 32px",
                  borderRadius: "10px",
                  border: "1px solid #52698f",
                  background: "transparent",
                  color: "white",
                  fontSize: "16px",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* BACKEND STATUS */}
        <div
          style={{
            marginTop: "25px",
            padding: "18px",
            borderRadius: "12px",
            background: "#0b1b3b",
            border: "1px solid #20345c",
            textAlign: "center",
            color: "#9caac5",
            fontSize: "14px",
          }}
        >
          <span style={{ color: "#22c55e", fontWeight: "600" }}>
            ● Connected to Backend
          </span>
          {" — "}
          Endpoint: <code>POST http://127.0.0.1:5000/predict</code>
        </div>
      </main>
    </div>
  );
}

export default LiveANPR;