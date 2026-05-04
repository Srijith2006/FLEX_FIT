import { Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Pricing from "./pages/Pricing.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// New Components
import Marketplace from "./components/common/MarketPlace.jsx";
import VendorDashboard from "./components/Vendor/VendorDashboard.jsx";
import GroupChat from "./components/common/GroupChat.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Marketplace - Accessible to all logged-in users */}
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />

        {/* Dashboard & Profile */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Vendor Specific Route */}
        <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />

        {/* Group Chat - Usually accessed via a program ID */}
        <Route path="/group-chat/:programId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
