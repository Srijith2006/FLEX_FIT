import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}