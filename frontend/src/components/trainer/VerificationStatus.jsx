import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function VerificationStatus() {
  const { token } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = async () => {
    try {
      const res = await api.get("/trainers/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrainer(res.data.trainer);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const submit = async () => {
    if (!file) { setMsg({ type: "error", text: "Please select a certificate file." }); return; }
    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) {
      setMsg({ type: "error", text: "Only JPG, PNG, WEBP or PDF allowed." }); return;
    }
    const fd = new FormData();
    fd.append("certificate", file);
    setUploading(true); setMsg({ type: "", text: "" });
    try {
      await api.post("/trainers/verification", fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg({ type: "success", text: "Submitted! Admin will review within 24–48 hours." });
      setFile(null);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Upload failed." });
    } finally { setUploading(false); }
  };

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "180px" }}>
      <div className="spinner"></div>
    </div>
  );

  const status = trainer?.verificationStatus || "pending";

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (status === "approved") {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏅</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "32px",
            color: "var(--green)", letterSpacing: "2px", marginBottom: "8px" }}>
            VERIFIED TRAINER
          </div>
          <p style={{ color: "var(--text2)", fontSize: "14px", maxWidth: "360px", margin: "0 auto 20px" }}>
            Your credentials have been reviewed and approved by the FlexFit team.
            Your profile is live and visible to all clients.
          </p>
          <div style={{ display: "inline-flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius)",
              fontSize: "13px", color: "var(--green)", fontWeight: 600 }}>
              ✓ Identity Verified
            </div>
            <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius)",
              fontSize: "13px", color: "var(--green)", fontWeight: 600 }}>
              ✓ Certificate Approved
            </div>
            <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius)",
              fontSize: "13px", color: "var(--green)", fontWeight: 600 }}>
              ✓ Profile Listed
            </div>
          </div>
          {trainer?.certificateUrl && (
            <div style={{ marginTop: "20px" }}>
              <a
                href={`${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}${trainer.certificateUrl}`}
                target="_blank" rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                📎 View Your Certificate
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  if (status === "pending" && trainer?.certificateUrl) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "14px" }}>⏳</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px",
            color: "var(--gold)", letterSpacing: "1px", marginBottom: "8px" }}>
            UNDER REVIEW
          </div>
          <p style={{ color: "var(--text2)", fontSize: "14px", maxWidth: "360px", margin: "0 auto 20px" }}>
            Your certificate has been submitted and is being reviewed by our admin team.
            This typically takes 24–48 hours.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Submitted", done: true  },
              { step: "2", label: "In Review", done: false, active: true },
              { step: "3", label: "Approved",  done: false },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: s.done ? "var(--green)" : s.active ? "var(--gold)" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: "#fff",
                }}>
                  {s.done ? "✓" : s.step}
                </div>
                <div style={{ fontSize: "11px", color: s.active ? "var(--gold)" : s.done ? "var(--green)" : "var(--text3)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {trainer?.certificateUrl && (
            <div style={{ marginTop: "20px" }}>
              <a href={`${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}${trainer.certificateUrl}`}
                target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                📎 View Submitted Certificate
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── REJECTED or NOT SUBMITTED — show upload form ──────────────────────────
  return (
    <div className="card">
      {status === "rejected" && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <div>
            <strong>Application Rejected</strong>
            {trainer?.rejectionReason && (
              <div style={{ marginTop: "4px", fontSize: "13px" }}>Reason: {trainer.rejectionReason}</div>
            )}
            <div style={{ marginTop: "4px", fontSize: "13px" }}>
              Please upload a valid certification document and resubmit.
            </div>
          </div>
        </div>
      )}

      <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "8px" }}>
        {status === "rejected" ? "Resubmit Verification" : "Get Verified"}
      </h3>
      <p style={{ color: "var(--text2)", fontSize: "14px", marginBottom: "20px" }}>
        Upload your fitness certification to get verified. Verified trainers appear in search results
        and can publish programs.
      </p>

      <div className="alert alert-info" style={{ marginBottom: "16px" }}>
        📋 Accepted: JPG, PNG, WEBP, PDF · Max 10MB
      </div>

      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

      <div
        style={{
          border: `2px dashed ${file ? "var(--accent2)" : "var(--border2)"}`,
          borderRadius: "var(--radius-lg)", padding: "32px",
          textAlign: "center", cursor: "pointer", marginBottom: "16px",
          background: file ? "rgba(0,112,243,0.04)" : "var(--bg3)",
          transition: "all 0.2s",
        }}
        onClick={() => document.getElementById("cert-upload").click()}
      >
        <div style={{ fontSize: "36px", marginBottom: "10px" }}>{file ? "📄" : "📁"}</div>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          {file ? file.name : "Click to upload your certificate"}
        </div>
        <div style={{ color: "var(--text3)", fontSize: "13px" }}>
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "or drag and drop"}
        </div>
        <input id="cert-upload" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
          style={{ display: "none" }}
          onChange={e => { setFile(e.target.files?.[0] || null); setMsg({ type:"", text:"" }); }}
        />
      </div>

      <button className="btn btn-accent btn-full" onClick={submit} disabled={uploading || !file}>
        {uploading
          ? <><span className="spinner" style={{ borderTopColor: "#fff" }}></span> Uploading…</>
          : "Submit for Verification"}
      </button>

      <div style={{ marginTop: "20px", padding: "16px", background: "var(--bg3)",
        borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "14px" }}>📋 Verification Steps</div>
        <ol style={{ paddingLeft: "18px", color: "var(--text2)", fontSize: "13px", lineHeight: "2.2" }}>
          <li>Upload your fitness certification (ACE, NASM, CrossFit L1, etc.)</li>
          <li>Admin team reviews within 24–48 hours</li>
          <li>You receive approval notification</li>
          <li>Your profile goes live for clients to discover</li>
        </ol>
      </div>
    </div>
  );
}