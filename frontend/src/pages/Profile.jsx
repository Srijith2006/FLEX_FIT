import useAuth from "../hooks/useAuth.js";
import TrainerBrowse from "../components/client/TrainerBrowse.jsx";
import WorkoutLogger from "../components/client/WorkoutLogger.jsx";
import VerificationUpload from "../components/trainer/VerificationUpload.jsx";
import VerificationReview from "../components/admin/VerificationReview.jsx";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Dashboard</h2>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>

      {user?.role === "client" && (
        <>
          <TrainerBrowse />
          <WorkoutLogger />
        </>
      )}

      {user?.role === "trainer" && <VerificationUpload />}

      {user?.role === "admin" && <VerificationReview />}
    </div>
  );
}
