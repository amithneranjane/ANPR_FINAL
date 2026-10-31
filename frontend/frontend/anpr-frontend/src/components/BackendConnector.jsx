import React, { useState, useEffect } from "react";
import { getApiUrl, setApiUrl, checkBackendHealth } from "../services/api";

export default function BackendConnector() {
  const [isOpen, setIsOpen] = useState(false);
  const [backendUrl, setBackendInput] = useState("");
  const [status, setStatus] = useState("checking"); // 'connected' | 'error' | 'checking'
  const [statusMsg, setStatusMsg] = useState("");
  const [testing, setTesting] = useState(false);

  const checkStatus = async () => {
    setStatus("checking");
    const current = getApiUrl();
    const result = await checkBackendHealth(current);
    if (result.ok) {
      setStatus("connected");
      setStatusMsg("Backend is online and responding.");
    } else {
      setStatus("error");
      setStatusMsg(result.error || "Could not reach backend.");
    }
  };

  useEffect(() => {
    const saved = getApiUrl();
    setBackendInput(saved);
    checkStatus();
    // Periodically re-check health every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveAndTest = async (e) => {
    if (e) e.preventDefault();
    setTesting(true);
    const cleanUrl = backendUrl.trim().replace(/\/+$/, "");
    const result = await checkBackendHealth(cleanUrl);
    setTesting(false);

    if (result.ok) {
      setApiUrl(cleanUrl);
      setStatus("connected");
      setStatusMsg("Successfully connected to backend!");
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 700);
    } else {
      setStatus("error");
      setStatusMsg(`Connection failed: ${result.error || `HTTP ${result.status}`}. Make sure your Colab cell is actively running.`);
    }
  };

  const handleResetLocal = () => {
    setBackendInput("http://127.0.0.1:5000");
    setApiUrl("http://127.0.0.1:5000");
    checkStatus();
  };

  const currentUrl = getApiUrl();
  const isColab = currentUrl.includes("trycloudflare.com") || currentUrl.includes("loca.lt");

  return (
    <>
      {/* Floating Status Pill */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
          padding: "6px 14px",
          borderRadius: "9999px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
        onClick={() => setIsOpen(true)}
        title="Click to configure backend connection (Google Colab / Local)"
      >
        <span
          style={{
            display: "inline-block",
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            backgroundColor:
              status === "connected" ? "#10b981" : status === "checking" ? "#f59e0b" : "#ef4444",
          }}
        />
        <span>
          {status === "connected"
            ? isColab
              ? "Backend: Colab (Online)"
              : "Backend: Online"
            : status === "checking"
            ? "Checking Backend..."
            : "Backend: Disconnected"}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#64748b",
            background: "#f1f5f9",
            padding: "2px 6px",
            borderRadius: "4px",
            marginLeft: "4px",
          }}
        >
          ⚙️ Change
        </span>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "16px",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>☁️</span> Connect to Backend (Colab)
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, marginBottom: "16px" }}>
              Connect your frontend to a <strong>Google Colab</strong> (free GPU + 12.7GB RAM) or local Flask server to run AI plate detections without memory limits.
            </p>

            <form onSubmit={handleSaveAndTest}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#334155" }}>
                Backend Server URL
              </label>
              <input
                type="url"
                value={backendUrl}
                onChange={(e) => setBackendInput(e.target.value)}
                placeholder="https://xyz.trycloudflare.com or http://127.0.0.1:5000"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                  outline: "none",
                }}
              />

              {statusMsg && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "14px",
                    backgroundColor: status === "connected" ? "#ecfdf5" : "#fef2f2",
                    color: status === "connected" ? "#065f46" : "#991b1b",
                    border: `1px solid ${status === "connected" ? "#a7f3d0" : "#fecaca"}`,
                  }}
                >
                  {status === "connected" ? "✅" : "⚠️"} {statusMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleResetLocal}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Reset Localhost
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: testing ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(37,99,235,0.25)",
                  }}
                >
                  {testing ? "Testing Connection..." : "Save & Connect"}
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              <strong style={{ color: "#334155" }}>💡 Quick Colab Setup:</strong>
              <ol style={{ margin: "6px 0 0 18px", padding: 0, lineHeight: 1.6 }}>
                <li>Run your <code>colab_deploy.ipynb</code> cell in Google Colab.</li>
                <li>Copy the generated <code>https://xxxx.trycloudflare.com</code> URL.</li>
                <li>Paste it into the field above and click <strong>Save &amp; Connect</strong>!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
