
export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export const getEvidenceImageUrl = (relativePath) => {
  if (!relativePath) return "";
  if (/^(https?:\/\/|blob:|data:)/.test(relativePath)) return relativePath;
  const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${API_URL}/${cleanPath}`;
};

const handleFetchError = (err) => {
  if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
    throw new Error("Backend server is not reachable. Please check the backend URL and server status.");
  }
  throw err;
};

const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const body = await response.text();
      let message = `HTTP error ${response.status}`;
      try {
        const json = JSON.parse(body);
        message = json.error || message;
      } catch {
        if (body) message = body;
      }
      throw new Error(message);
    }
    return await response.json();
  } catch (err) {
    handleFetchError(err);
  }
};

export const recognizePlate = async (imageFile, options = {}) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (options.latitude !== undefined && options.latitude !== null && options.latitude !== "") formData.append("latitude", options.latitude);
  if (options.longitude !== undefined && options.longitude !== null && options.longitude !== "") formData.append("longitude", options.longitude);
  if (options.location) formData.append("location", options.location);
  return request(`${API_URL}/predict`, { method: "POST", body: formData });
};

export const getHistory = () => request(`${API_URL}/history`);
export const clearHistory = () => request(`${API_URL}/history`, { method: "DELETE" });
export const searchHistory = (plate) => request(`${API_URL}/history/search?plate=${encodeURIComponent(plate)}`);
export const filterHistory = (status) => request(`${API_URL}/history/filter?status=${encodeURIComponent(status)}`);

export const getStats = () => request(`${API_URL}/stats`);
export const getDailyAnalytics = () => request(`${API_URL}/analytics/daily`);
export const getHourlyAnalytics = () => request(`${API_URL}/analytics/hourly`);
export const getRepeatedAnalytics = () => request(`${API_URL}/analytics/repeated`);
export const getWatchlistAnalytics = () => request(`${API_URL}/analytics/watchlist`);

export const getWatchlist = () => request(`${API_URL}/watchlist`);

export const addToWatchlist = (plate_number, reason = "Watchlist vehicle") =>
  request(`${API_URL}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plate_number, reason }),
  });

export const deleteFromWatchlist = (plate_number) =>
  request(`${API_URL}/watchlist/${encodeURIComponent(plate_number)}`, { method: "DELETE" });

export const getVehicles = () => request(`${API_URL}/vehicles`);

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

export const addVehicle = (vehicleData) =>
  request(`${API_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicleData),
  });

export const deleteVehicle = (plate_number) =>
  request(`${API_URL}/vehicles/${encodeURIComponent(plate_number)}`, { method: "DELETE" });

export const getMapDetections = () => request(`${API_URL}/map/detections`);

export const CSV_REPORT_URL = `${API_URL}/report/csv`;
export const PDF_REPORT_URL = `${API_URL}/report/pdf`;
