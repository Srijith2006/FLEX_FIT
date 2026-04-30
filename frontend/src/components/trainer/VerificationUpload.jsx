import { useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function VerificationUpload() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) { setMsg({ type: "error", text: "Please choose a certificate file." }); return; }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setMsg({ type: "error", text: "Please upload a JPG, PNG, WEBP, or PDF file." });
      return;
    }

    const fd = new FormData();
    fd.append("certificate", file);
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/trainers/verification", fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Verification submitted! Our admin team will review within 24–48 hours." });
      setFile(null);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Upload failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "8px" }}>Trainer Verification</h3>
      <p style={{ color: "var(--text2)", fontSize: "14px", marginBottom: "24px" }}>
        Upload your fitness certification to get verified. Verified trainers appear in client searches.
      </p>

      {/* Status Info */}
      <div className="alert alert-info mb-4">
        ℹ️ Accepted formats: JPG, PNG, WEBP, PDF. Max size: 10MB.
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>
          {msg.text}
        </div>
      )}

      {/* Upload Area */}
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
        <input
          id="cert-upload"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          style={{ display: "none" }}
          onChange={e => {
            setFile(e.target.files?.[0] || null);
            setMsg({ type: "", text: "" });
          }}
        />
      </div>

      <button
        className="btn btn-accent btn-full"
        onClick={submit}
        disabled={loading || !file}
      >
        {loading ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Uploading…</> : "Submit for Verification"}
      </button>

      <div style={{ marginTop: "24px", padding: "16px", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "14px" }}>📋 Verification Process</div>
        <ol style={{ paddingLeft: "18px", color: "var(--text2)", fontSize: "13px", lineHeight: "2" }}>
          <li>Upload your certification document</li>
          <li>Admin team reviews within 24–48 hours</li>
          <li>You receive approval or feedback notification</li>
          <li>Upon approval, your profile goes live for clients to discover</li>
        </ol>
      </div>
    </div>
  );
}