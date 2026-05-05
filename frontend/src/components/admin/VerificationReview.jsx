import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function VerificationReview() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [vendors, setVendors]   = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [tRes, vRes] = await Promise.all([
        api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { trainers: [] } })),
        api.get("/vendors/all",  { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { vendors: [] } })),
      ]);
      setTrainers((tRes.data.trainers || []).filter(t => t.verificationStatus === "pending"));
      setVendors((vRes.data.vendors   || []).filter(v => v.verificationStatus === "pending"));
    } catch { setMsg("Failed to load queue."); }
  };

  useEffect(() => { load(); }, []);

  const reviewTrainer = async (id, status) => {
    try {
      await api.patch(`/trainers/${id}/review`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(`Trainer ${status}.`); load();
    } catch (e) { setMsg(e?.response?.data?.message || "Review failed."); }
  };

  const reviewVendor = async (id, status) => {
    try {
      await api.patch(`/vendors/${id}/review`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(`Vendor ${status}.`); load();
    } catch (e) { setMsg(e?.response?.data?.message || "Review failed."); }
  };

  const total = trainers.length + vendors.length;

  return (
    <div className="card">
      <h3>Verification Queue {total > 0 && <span style={{ color:"var(--gold)" }}>({total} pending)</span>}</h3>
      {msg && <p className="success">{msg}</p>}

      {/* Trainers */}
      {trainers.length > 0 && (
        <>
          <h4 style={{ color:"var(--text3)", fontSize:13, marginTop:16, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
            💪 Trainers
          </h4>
          {trainers.map(t => (
            <div className="list-row" key={t._id}>
              <div>
                <strong>{t.user?.name || "Trainer"}</strong>
                <p className="muted">{t.user?.email}</p>
                {t.certificateUrl
                  ? <a href={`${BASE_URL}${t.certificateUrl}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"var(--accent2)" }}>📎 View Certificate</a>
                  : <span className="muted" style={{ fontSize:12 }}>No certificate</span>
                }
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary" onClick={() => reviewTrainer(t._id, "approved")}>Approve</button>
                <button className="btn btn-outline" onClick={() => reviewTrainer(t._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Vendors */}
      {vendors.length > 0 && (
        <>
          <h4 style={{ color:"var(--text3)", fontSize:13, marginTop:16, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
            🏪 Vendors
          </h4>
          {vendors.map(v => (
            <div className="list-row" key={v._id}>
              <div>
                <strong>{v.businessName || "Business name not set"}</strong>
                <p className="muted">{v.user?.name} · {v.user?.email}</p>
                {v.city && <p className="muted" style={{ fontSize:12 }}>📍 {v.city} · 🏷 {v.businessType}</p>}
                {v.certificateUrl
                  ? <a href={`${BASE_URL}${v.certificateUrl}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"var(--accent2)" }}>📄 View License / Certificate</a>
                  : <span className="muted" style={{ fontSize:12 }}>⚠ No certificate uploaded</span>
                }
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary" onClick={() => reviewVendor(v._id, "approved")}>Approve</button>
                <button className="btn btn-outline" onClick={() => reviewVendor(v._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </>
      )}

      {total === 0 && <p className="muted">No pending applications.</p>}
    </div>
  );
}