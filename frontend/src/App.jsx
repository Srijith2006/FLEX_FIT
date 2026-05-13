import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import Home from "./pages/Home.jsx";
import Pricing from "./pages/Pricing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";

export default function App() {
  const location = useLocation();

  // Define the paths where the global Navbar should NOT be displayed
  // "/" is hidden because Home.jsx provides its own sleek nav
  // "/login" and "/register" are hidden to keep the auth screens clean
  const hideNavbarPaths = ["/", "/login", "/register"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {/* Conditionally render the global Navbar */}
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/pricing"     element={<Pricing />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        
        {/* Dashboard remains protected */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}