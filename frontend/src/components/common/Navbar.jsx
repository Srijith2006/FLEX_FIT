import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const roleBadgeClass = {
    client: "badge-client",
    trainer: "badge-trainer",
    admin: "badge-admin",
    vendor: "badge-vendor", // Added vendor class
  }[user?.role] || "badge-client";

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          FLEX<span className="brand-dot">FIT</span>
        </Link>

        <nav className="navlinks">
          <Link to="/" className="hide-mobile">Home</Link>
          <Link to="/pricing" className="hide-mobile">Pricing</Link>
          
          {/* Marketplace is visible to everyone */}
          <Link to="/marketplace">Marketplace</Link>

          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              
              {/* Only show Vendor Portal if the user is a vendor */}
              {user.role === "vendor" && (
                <Link to="/vendor/dashboard" className="text-accent">Vendor Portal</Link>
              )}

              <div className="nav-user">
                <div className="nav-avatar">{initials}</div>
                <span className="nav-user-name">{user.name.split(" ")[0]}</span>
                <span className={`nav-badge ${roleBadgeClass}`}>{user.role}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}