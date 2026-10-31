// Dynamic Backend URL resolution (Google Colab, Localhost, or Cloud)
export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    let saved = localStorage.getItem("ANPR_BACKEND_URL");
    if (saved && saved.trim()) {
      saved = saved.trim().replace(/\/+$/, "");
      if (!saved.startsWith("http://") && !saved.startsWith("https://")) {
        saved = "https://" + saved;
      }
      return saved;
    }
  }

  if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== "") {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }

  // If running in browser and hosted on an external domain like render.com:
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "";
    }
  }

  return "http://127.0.0.1:5000";
};

export const setApiUrl = (url) => {
  if (typeof window === "undefined") return;
  if (url && url.trim()) {
    let clean = url.trim().replace(/\/+$/, "");
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    if (
      window.location.protocol === "https:" &&
      clean.startsWith("http://") &&
      !clean.includes("localhost") &&
      !clean.includes("127.0.0.1")
    ) {
      clean = clean.replace("http://", "https://");
    }
    localStorage.setItem("ANPR_BACKEND_URL", clean);
  } else {
    localStorage.removeItem("ANPR_BACKEND_URL");
  }
};

export const checkBackendHealth = async (customUrl) => {
  let base = (customUrl !== undefined ? customUrl : getApiUrl()).trim().replace(/\/+$/, "");
  if (base && !base.startsWith("http://") && !base.startsWith("https://")) {
    base = "https://" + base;
  }
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    base.startsWith("http://") &&
    !base.includes("localhost") &&
    !base.includes("127.0.0.1")
  ) {
    base = base.replace("http://", "https://");
  }

  if (
    !base &&
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return { ok: false, error: "Please enter your Colab HTTPS URL." };
  }

  const testUrl = base ? `${base}/health` : "/health";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(testUrl, {
      signal: controller.signal,
      mode: "cors",
      headers: {
        "bypass-tunnel-reminder": "true",
        "ngrok-skip-browser-warning": "true",
      },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, data };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    if (err.name === "AbortError") {
      return {
        ok: false,
        error: "Connection timed out (10s). The Colab notebook may still be loading YOLO/EasyOCR models.",
      };
    }
    return { ok: false, error: err.message || "Network Error" };
  }
};

// Helper for relative paths
const apiUrl = (path) => {
  const base = getApiUrl();
  return base ? `${base}${path}` : path;
};

// Default tunnel bypass headers
const getHeaders = (extraHeaders = {}) => {
  return {
    "bypass-tunnel-reminder": "true",
    "ngrok-skip-browser-warning": "true",
    ...extraHeaders,
  };
};

// For backward compatibility:
export const API_URL = getApiUrl();

// Helper to convert relative evidence paths into full backend URLs
export const getEvidenceImageUrl = (relativePath) => {
  if (!relativePath) return "";
  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://") ||
    relativePath.startsWith("blob:") ||
    relativePath.startsWith("data:")
  ) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.slice(1)
    : relativePath;
  const base = getApiUrl();
  return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
};

// Generic fetch wrapper with offline detection
const handleFetchError = (err) => {
  if (
    err.name === "TypeError" ||
    (err.message &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")))
  ) {
    throw new Error(
      "Backend server is not reachable. Please connect your Colab backend or start Flask."
    );
  }
  throw err;
};

// 1. Predict / ANPR Number Plate Detection
export const recognizePlate = async (imageFile, options = {}) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  if (
    options.latitude !== undefined &&
    options.latitude !== null &&
    options.latitude !== ""
  ) {
    formData.append("latitude", options.latitude);
  }
  if (
    options.longitude !== undefined &&
    options.longitude !== null &&
    options.longitude !== ""
  ) {
    formData.append("longitude", options.longitude);
  }
  if (options.location) {
    formData.append("location", options.location);
  }

  try {
    const response = await fetch(apiUrl("/predict"), {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Backend error ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 2. Detection History
export const getHistory = async () => {
  try {
    const response = await fetch(apiUrl("/history"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const clearHistory = async () => {
  try {
    const response = await fetch(apiUrl("/history"), {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const searchHistory = async (plate) => {
  try {
    const response = await fetch(
      apiUrl(`/history/search?plate=${encodeURIComponent(plate)}`),
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const filterHistory = async (status) => {
  try {
    const response = await fetch(
      apiUrl(`/history/filter?status=${encodeURIComponent(status)}`),
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 3. Overall Statistics
export const getStats = async () => {
  try {
    const response = await fetch(apiUrl("/stats"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 4. Analytics
export const getDailyAnalytics = async () => {
  try {
    const response = await fetch(apiUrl("/analytics/daily"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getHourlyAnalytics = async () => {
  try {
    const response = await fetch(apiUrl("/analytics/hourly"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getRepeatedAnalytics = async () => {
  try {
    const response = await fetch(apiUrl("/analytics/repeated"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getWatchlistAnalytics = async () => {
  try {
    const response = await fetch(apiUrl("/analytics/watchlist"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 5. Watchlist Management
export const getWatchlist = async () => {
  try {
    const response = await fetch(apiUrl("/watchlist"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const addToWatchlist = async (
  plate_number,
  reason = "Watchlist vehicle"
) => {
  try {
    const response = await fetch(apiUrl("/watchlist"), {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ plate_number, reason }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const deleteFromWatchlist = async (plate_number) => {
  try {
    const response = await fetch(
      apiUrl(`/watchlist/${encodeURIComponent(plate_number)}`),
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 6. Vehicles / Owner Details Management
export const getVehicles = async () => {
  try {
    const response = await fetch(apiUrl("/vehicles"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getVehicle = async (plate_number) => {
  try {
    const response = await fetch(
      apiUrl(`/vehicles/${encodeURIComponent(plate_number)}`),
      { headers: getHeaders() }
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    const response = await fetch(apiUrl("/vehicles"), {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const deleteVehicle = async (plate_number) => {
  try {
    const response = await fetch(
      apiUrl(`/vehicles/${encodeURIComponent(plate_number)}`),
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 7. Map Detections
export const getMapDetections = async () => {
  try {
    const response = await fetch(apiUrl("/map/detections"), {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 8. Report Endpoints
export const getCsvReportUrl = () => apiUrl("/report/csv");
export const getPdfReportUrl = () => apiUrl("/report/pdf");
export const CSV_REPORT_URL = "/report/csv";
export const PDF_REPORT_URL = "/report/pdf";
