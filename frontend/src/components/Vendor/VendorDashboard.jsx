import { useState, useEffect } from "react";
import api from "../../services/api.js";

const BUSINESS_TYPES = [
  { value: "supplements", label: "Supplements" },
  { value: "meal_kitchen", label: "Meal Kitchen" },
  { value: "equipment", label: "Equipment" },
  { value: "apparel", label: "Apparel" },
  { value: "other", label: "Other" },
];

const STATUS_CONFIG = {
  pending:  { color: "#f59e0b", label: "⏳ Pending Review",  desc: "Your profile is under admin review." },
  approved: { color: "#10b981", label: "✅ Approved",         desc: "You can now list products." },
  rejected: { color: "#ef4444", label: "❌ Rejected",         desc: "See reason below and re-upload your certificate." },
};

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile setup form state
  const [form, setForm] = useState({
    businessName: "", businessType: "supplements",
    description: "", phone: "", address: "", city: "", gstNumber: "",
  });

  // Certificate file
  const [certFile, setCertFile] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/vendors/me");
      if (data.vendor) {
        setVendor(data.vendor);
        setForm({
          businessName: data.vendor.businessName || "",
          businessType: data.vendor.businessType || "supplements",
          description:  data.vendor.description || "",
          phone:        data.vendor.phone || "",
          address:      data.vendor.address || "",
          city:         data.vendor.city || "",
          gstNumber:    data.vendor.gstNumber || "",
        });
      }
    } catch (e) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // First-time setup — POST /api/vendors/register
  const setupProfile = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.businessName.trim()) { setError("Business name is required."); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/vendors/register", form);
      setVendor(data.vendor);
      setSuccess("Profile created! Now upload your license certificate below.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create profile.");
    } finally { setSaving(false); }
  };

  // Update existing profile — PUT /api/vendors/me
  const updateProfile = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const { data } = await api.put("/vendors/me", form);
      setVendor(data.vendor);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  // Upload certificate — PUT /api/vendors/me/certificate
  const uploadCertificate = async () => {
    if (!certFile) { setError("Please select a certificate file first."); return; }
    setError(""); setSuccess("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("certificate", certFile);
      const { data } = await api.put("/vendors/me/certificate", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Certificate uploaded! Admin will review and approve your account.");
      setCertFile(null);
      // Refresh vendor to show updated certificateUrl & pending status
      fetchProfile();
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", color:"var(--text3)" }}>
      Loading your dashboard…
    </div>
  );

  const statusCfg = vendor ? STATUS_CONFIG[vendor.verificationStatus] : null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ color:"var(--text)", marginBottom: 4 }}>
        FLEX<span style={{ color:"var(--accent)" }}>FIT</span> — Vendor Dashboard
      </h1>
      <p style={{ color:"var(--text3)", marginBottom: 32 }}>
        {vendor ? "Manage your business profile and products." : "Complete your profile to get started."}
      </p>

      {/* ── Verification Status Banner ── */}
      {vendor && statusCfg && (
        <div style={{
          background: `${statusCfg.color}18`, border: `1px solid ${statusCfg.color}44`,
          borderRadius: 10, padding: "14px 18px", marginBottom: 28,
        }}>
          <div style={{ fontWeight: 700, color: statusCfg.color, fontSize: 15 }}>{statusCfg.label}</div>
          <div style={{ color:"var(--text3)", fontSize: 13, marginTop: 4 }}>{statusCfg.desc}</div>
          {vendor.verificationStatus === "rejected" && vendor.rejectionReason && (
            <div style={{ color:"#ef4444", fontSize: 13, marginTop: 6 }}>
              Reason: {vendor.rejectionReason}
            </div>
          )}
        </div>
      )}

      {/* ── Business Profile Form ── */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:24, marginBottom:24 }}>
        <h2 style={{ color:"var(--text)", fontSize:17, marginBottom:20 }}>
          {vendor ? "Business Profile" : "Set Up Your Business Profile"}
        </h2>

        <form onSubmit={vendor ? updateProfile : setupProfile}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input className="form-input" required placeholder="e.g. NutriMax Store"
                value={form.businessName} onChange={handle("businessName")} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select className="form-input" value={form.businessType} onChange={handle("businessType")}>
                {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom:16 }}>
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="What do you sell?"
              value={form.description} onChange={handle("description")}
              style={{ resize:"vertical" }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 9876543210"
                value={form.phone} onChange={handle("phone")} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="Mumbai"
                value={form.city} onChange={handle("city")} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom:16 }}>
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="Street, Area, PIN"
              value={form.address} onChange={handle("address")} />
          </div>

          <div className="form-group" style={{ marginBottom:20 }}>
            <label className="form-label">GST Number</label>
            <input className="form-input" placeholder="22AAAAA0000A1Z5"
              value={form.gstNumber} onChange={handle("gstNumber")} />
          </div>

          <button className="btn btn-accent" type="submit" disabled={saving}
            style={{ minWidth:160 }}>
            {saving ? "Saving…" : vendor ? "Update Profile" : "Create Profile"}
          </button>
        </form>
      </div>

      {/* ── Certificate Upload (only shown after profile exists) ── */}
      {vendor && (
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:24, marginBottom:24 }}>
          <h2 style={{ color:"var(--text)", fontSize:17, marginBottom:6 }}>License / FSSAI Certificate</h2>
          <p style={{ color:"var(--text3)", fontSize:13, marginBottom:16 }}>
            Upload your business license or FSSAI certificate. Admin will verify it before approving your account.
          </p>

          {/* Show existing cert */}
          {vendor.certificateUrl && (
            <div style={{ marginBottom:16, padding:"10px 14px", background:"var(--bg3)", borderRadius:8,
              display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>📄</span>
              <div>
                <div style={{ color:"var(--text)", fontSize:13, fontWeight:600 }}>Current Certificate</div>
                <a href={vendor.certificateUrl} target="_blank" rel="noreferrer"
                  style={{ color:"var(--accent)", fontSize:12 }}>View uploaded certificate →</a>
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
            <div className="form-group" style={{ flex:1, marginBottom:0 }}>
              <label className="form-label">
                {vendor.certificateUrl ? "Replace Certificate" : "Upload Certificate"} (PDF / JPG / PNG)
              </label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setCertFile(e.target.files[0])}
                style={{ color:"var(--text)", fontSize:13 }} />
            </div>
            <button className="btn btn-accent" onClick={uploadCertificate}
              disabled={uploading || !certFile} style={{ minWidth:140, marginBottom:2 }}>
              {uploading ? "Uploading…" : "Upload Certificate"}
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback messages ── */}
      {error   && <div className="alert alert-error"  style={{ marginTop:16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginTop:16 }}>✓ {success}</div>}

      {/* ── Products section (only for approved vendors) ── */}
      {vendor?.verificationStatus === "approved" && (
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
          <h2 style={{ color:"var(--text)", fontSize:17, marginBottom:8 }}>Your Products</h2>
          <p style={{ color:"var(--text3)", fontSize:13 }}>
            You're verified! Head to the Products tab to manage your listings.
          </p>
        </div>
      )}
    </div>
  );
}