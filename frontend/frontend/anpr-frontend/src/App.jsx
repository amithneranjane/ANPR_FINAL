import Reports from "./pages/Reports";
import LocationMap from "./pages/LocationMap";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import LiveANPR from "./pages/LiveANPR";
import VehicleRecords from "./pages/VehicleRecords";
import Analytics from "./pages/Analytics";
import RecognitionResult from "./pages/RecognitionResult";
import VehicleDetails from "./pages/VehicleDetails.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/watchlist" element={<Watchlist />} />
       
        <Route path="/location" element={<LocationMap />} />

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/vehicle-detection"
          element={<LiveANPR />}
        />

        <Route
          path="/recognition-result"
          element={<RecognitionResult />}
        />

        <Route
          path="/vehicle-details"
          element={<VehicleDetails />}
        />

        <Route
          path="/vehicle-records"
          element={<VehicleRecords />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />
        <Route path="/reports" element={<Reports />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;