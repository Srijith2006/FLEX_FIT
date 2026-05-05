// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Pricing from "./pages/Pricing.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Components
import Marketplace from "./components/client/Marketplace.jsx";
import VendorDashboard from "./components/Vendor/VendorDashboard.jsx";
import GroupChat from "./components/common/GroupChat.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Marketplace */}
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />

        {/* Dashboards */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Vendor Dashboard Protected for Role 'vendor' */}
        <Route 
          path="/vendor/dashboard" 
          element={
            <ProtectedRoute role="vendor">
              <VendorDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="/group-chat/:programId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
      </Routes>
    </>
  );
}