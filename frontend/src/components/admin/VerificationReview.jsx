import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function VerificationReview() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await api.get("/trainers");
    setTrainers((res.data.trainers || []).filter(t => t.verificationStatus === "pending"));
  };

  useEffect(() => { load().catch(()=>{}); }, []);

  const review = async (id, status) => {
    try {
      await api.patch(`/trainers/${id}/review`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(`Trainer ${status}.`);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Review failed.");
    }
  };

  return (
    <div className="card">
      <h3>Verification Queue</h3>
      {msg && <p className="success">{msg}</p>}
      {trainers.length === 0 && <p className="muted">No pending trainers.</p>}
      {trainers.map((t) => (
        <div className="list-row" key={t._id}>
          <div>
            <strong>{t.user?.name || "Trainer"}</strong>
            <p className="muted">{t.certificateUrl || "No certificate URL"}</p>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="btn btn-primary" onClick={() => review(t._id, "approved")}>Approve</button>
            <button className="btn btn-outline" onClick={() => review(t._id, "rejected")}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
