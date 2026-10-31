export const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : "http://127.0.0.1:5000";

// Helper to convert relative evidence paths (e.g., "evidence/plates/...")
// into full backend URLs (e.g., "http://127.0.0.1:5000/evidence/plates/...")
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
  return API_URL ? `${API_URL}/${cleanPath}` : `/${cleanPath}`;
};

// Generic fetch wrapper with offline detection
const handleFetchError = (err) => {
  if (
    err.name === "TypeError" ||
    (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")))
  ) {
    throw new Error("Backend server is not reachable. Please check if the API is running.");
  }
  throw err;
};

// 1. Predict / ANPR Number Plate Detection
export const recognizePlate = async (imageFile, options = {}) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  if (options.latitude !== undefined && options.latitude !== null && options.latitude !== "") {
    formData.append("latitude", options.latitude);
  }
  if (options.longitude !== undefined && options.longitude !== null && options.longitude !== "") {
    formData.append("longitude", options.longitude);
  }
  if (options.location) {
    formData.append("location", options.location);
  }

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
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
    const response = await fetch(`${API_URL}/history`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const clearHistory = async () => {
  try {
    const response = await fetch(`${API_URL}/history`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const searchHistory = async (plate) => {
  try {
    const response = await fetch(`${API_URL}/history/search?plate=${encodeURIComponent(plate)}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const filterHistory = async (status) => {
  try {
    const response = await fetch(`${API_URL}/history/filter?status=${encodeURIComponent(status)}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 3. Overall Statistics
export const getStats = async () => {
  try {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 4. Analytics
export const getDailyAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/analytics/daily`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getHourlyAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/analytics/hourly`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getRepeatedAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/analytics/repeated`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getWatchlistAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/analytics/watchlist`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 5. Watchlist Management
export const getWatchlist = async () => {
  try {
    const response = await fetch(`${API_URL}/watchlist`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const addToWatchlist = async (plate_number, reason = "Watchlist vehicle") => {
  try {
    const response = await fetch(`${API_URL}/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`${API_URL}/watchlist/${encodeURIComponent(plate_number)}`, {
      method: "DELETE",
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

// 6. Vehicles / Owner Details Management
export const getVehicles = async () => {
  try {
    const response = await fetch(`${API_URL}/vehicles`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const getVehicle = async (plate_number) => {
  try {
    const response = await fetch(`${API_URL}/vehicles/${encodeURIComponent(plate_number)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    const response = await fetch(`${API_URL}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`${API_URL}/vehicles/${encodeURIComponent(plate_number)}`, {
      method: "DELETE",
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

// 7. Map Detections
export const getMapDetections = async () => {
  try {
    const response = await fetch(`${API_URL}/map/detections`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

// 8. Report Endpoints
export const CSV_REPORT_URL = `${API_URL}/report/csv`;
export const PDF_REPORT_URL = `${API_URL}/report/pdf`;