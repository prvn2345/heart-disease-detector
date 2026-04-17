import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import PredictPage from "./pages/PredictPage";
import HistoryPage from "./pages/HistoryPage";
import PredictionDetailPage from "./pages/PredictionDetailPage";
import SampleDataPage from "./pages/SampleDataPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"            element={<DashboardPage />} />
            <Route path="/predict"     element={<PredictPage />} />
            <Route path="/history"     element={<HistoryPage />} />
            <Route path="/history/:id" element={<PredictionDetailPage />} />
            <Route path="/samples"     element={<SampleDataPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
