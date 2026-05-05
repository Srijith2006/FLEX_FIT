import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const STATUS_PIPELINE = ["pending","confirmed","preparing","shipped","delivered"];
const STATUS_COLORS = {
  pending:   "var(--text3)",
  confirmed: "var(--accent2)",
  preparing: "var(--gold)",
  shipped:   "var(--accent)",
  delivered: "var(--green)",
  cancelled: "var(--red)",
};

const VERIFICATION_CONFIG = {
  pending:  { color: "#f59e0b", icon: "⏳", label: "Pending Admin Approval",
    desc: "Your documents are under review. You can browse your dashboard but cannot list products yet." },
  approved: { color: "#10b981", icon: "✅", label: "Verified Vendor",
    desc: "Your account is approved. You can list and sell products." },
  rejected: { color: "#ef4444", icon: "❌", label: "Application Rejected",
    desc: "Re-upload your certificate after fixing the issue mentioned below." },
};

// ── Order Card ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = STATUS_PIPELINE[STATUS_PIPELINE.indexOf(order.status) + 1];

  const advance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try { await onStatusUpdate(order._id, nextStatus); }
    finally { setUpdating(false); }
  };

  return (
    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)",
      borderRadius:"var(--radius)", padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"14px" }}>{order.client?.user?.name || "Client"}</div>
          <div style={{ fontSize:"12px", color:"var(--text3)" }}>
            {order.client?.user?.email} · {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"var(--green)" }}>
            ₹{order.total}
          </div>
          <span style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase",
            color: STATUS_COLORS[order.status] || "var(--text3)" }}>
            ● {order.status}
          </span>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"10px" }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between",
            fontSize:"13px", color:"var(--text2)" }}>
            <span>{item.name} × {item.quantity}</span>
            <span>₹{item.totalPrice}</span>
          </div>
        ))}
      </div>

      {order.deliveryAddress && (
        <div style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"10px" }}>
          📍 {order.deliveryAddress}
          {order.deliveryPhone && ` · 📞 ${order.deliveryPhone}`}
        </div>
      )}

      <div style={{ display:"flex", gap:"4px", marginBottom:"12px" }}>
        {STATUS_PIPELINE.map(s => (
          <div key={s} style={{
            flex:1, height:"4px", borderRadius:"2px",
            background: STATUS_PIPELINE.indexOf(s) <= STATUS_PIPELINE.indexOf(order.status)
              ? "var(--accent2)" : "var(--border)",
            transition:"background 0.3s",
          }} />
        ))}
      </div>

      {nextStatus && order.status !== "cancelled" && (
        <button className="btn btn-primary btn-sm btn-full" onClick={advance} disabled={updating}>
          {updating ? "Updating…" : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →`}
        </button>
      )}
      {order.status === "delivered" && (
        <div className="alert alert-success" style={{ fontSize:"12px", padding:"8px 12px" }}>✓ Order completed</div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const { token } = useAuth();
  const [vendor, setVendor]     = useState(null);
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab]           = useState("overview");
  const [loading, setLoading]   = useState(true);
  const [registering, setRegistering] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [regForm, setRegForm] = useState({
    businessName:"", businessType:"supplements", description:"", city:""
  });
  const [msg, setMsg] = useState({ type:"", text:"" });

  const loadAll = async () => {
    try {
      const [vRes, oRes, pRes] = await Promise.allSettled([
        api.get("/vendors/me",            { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/orders/vendor",         { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/vendors/products/mine", { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      if (vRes.status === "fulfilled") setVendor(vRes.value.data.vendor);
      if (oRes.status === "fulfilled") setOrders(oRes.value.data.orders || []);
      if (pRes.status === "fulfilled") setProducts(pRes.value.data.products || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [token]);

  // ── Register vendor profile (first time) ──
  const register = async () => {
    if (!regForm.businessName) { setMsg({ type:"error", text:"Business name is required." }); return; }
    setRegistering(true);
    try {
      const res = await api.post("/vendors/register", regForm, { headers:{ Authorization:`Bearer ${token}` } });
      setVendor(res.data.vendor);
      setMsg({ type:"success", text:"Profile created! Now upload your license certificate below." });
    } catch(e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Registration failed." });
    } finally { setRegistering(false); }
  };

  // ── Certificate upload ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("certificate", file);
    setUploading(true);
    setMsg({ type:"info", text:"Uploading certificate…" });
    try {
      const res = await api.put("/vendors/me/certificate", formData, {
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"multipart/form-data" },
      });
      // Refresh full vendor so status banner updates
      const vRes = await api.get("/vendors/me", { headers:{ Authorization:`Bearer ${token}` } });
      setVendor(vRes.data.vendor);
      setMsg({ type:"success", text:"Certificate uploaded! Admin will review and approve your account." });
    } catch {
      setMsg({ type:"error", text:"Upload failed. Please try again." });
    } finally { setUploading(false); }
  };

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status }, { headers:{ Authorization:`Bearer ${token}` } });
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
  };

  // ── Loading ──
  if (loading) return (
    <div className="card loading-screen" style={{ minHeight:"200px" }}>
      <div className="spinner" />
    </div>
  );

  // ── No vendor profile yet → registration form ──
  if (!vendor) return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize:"22px", marginBottom:"8px" }}>Set Up Your Vendor Profile</h3>
      <p style={{ color:"var(--text2)", fontSize:"14px", marginBottom:"20px" }}>
        List your supplements, meals, or fitness products on FlexFit Marketplace.
      </p>
      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        <div className="form-group">
          <label className="form-label">Business Name *</label>
          <input className="form-input" placeholder="e.g. ProNutrition Labs"
            value={regForm.businessName}
            onChange={e => setRegForm(f => ({ ...f, businessName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Business Type</label>
          <select className="form-select" value={regForm.businessType}
            onChange={e => setRegForm(f => ({ ...f, businessType: e.target.value }))}>
            <option value="supplements">Supplements</option>
            <option value="meal_kitchen">Meal Kitchen</option>
            <option value="equipment">Equipment</option>
            <option value="apparel">Apparel</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" placeholder="e.g. Mumbai"
            value={regForm.city}
            onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows="2" placeholder="What do you sell?"
            value={regForm.description}
            onChange={e => setRegForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <button className="btn btn-accent btn-full" onClick={register} disabled={registering}>
          {registering ? "Creating Profile…" : "Create Vendor Profile"}
        </button>
      </div>
    </div>
  );

  const vcfg = VERIFICATION_CONFIG[vendor.verificationStatus];
  const isApproved = vendor.verificationStatus === "approved";
  const pendingOrders = orders.filter(o => ["pending","confirmed","preparing","shipped"].includes(o.status));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* ── Vendor Header ── */}
      <div className="card" style={{ padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:"20px" }}>{vendor.businessName}</div>
            <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"2px" }}>
              {vendor.businessType?.replace("_"," ")} · {vendor.city}
            </div>
          </div>
          <span className={`tag tag-${vendor.verificationStatus}`} style={{ textTransform:"capitalize" }}>
            {vendor.verificationStatus}
          </span>
        </div>
      </div>

      {/* ── Alert message ── */}
      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : msg.type === "info" ? "info" : "success"}`}>
          {msg.text}
          <button onClick={() => setMsg({ type:"", text:"" })}
            style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}

      {/* ── Verification Banner — always visible until approved ── */}
      {!isApproved && (
        <div style={{
          background: `${vcfg.color}12`, border:`1px solid ${vcfg.color}44`,
          borderRadius:"var(--radius)", padding:"16px 20px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:20 }}>{vcfg.icon}</span>
            <span style={{ fontWeight:700, color: vcfg.color, fontSize:15 }}>{vcfg.label}</span>
          </div>
          <p style={{ fontSize:13, color:"var(--text2)", marginBottom: vendor.verificationStatus === "rejected" ? 6 : 12 }}>
            {vcfg.desc}
          </p>

          {/* Rejection reason */}
          {vendor.verificationStatus === "rejected" && vendor.rejectionReason && (
            <div style={{ fontSize:13, color:"#ef4444", marginBottom:12, fontWeight:600 }}>
              Reason: {vendor.rejectionReason}
            </div>
          )}

          {/* Certificate upload — inside the banner */}
          <div style={{ background:"var(--bg2)", borderRadius:8, padding:"12px 14px" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:8 }}>
              📜 {vendor.certificateUrl ? "Replace License / FSSAI Certificate" : "Upload License / FSSAI Certificate"}
            </div>
            {vendor.certificateUrl && (
              <div style={{ marginBottom:8, fontSize:12, color:"var(--green)" }}>
                ✓ Current file:{" "}
                <a href={vendor.certificateUrl} target="_blank" rel="noreferrer"
                  style={{ color:"var(--accent)", textDecoration:"underline" }}>
                  View uploaded certificate
                </a>
              </div>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload} disabled={uploading}
              style={{ fontSize:13, color:"var(--text)" }} />
            {uploading && <div style={{ fontSize:12, color:"var(--text3)", marginTop:6 }}>Uploading…</div>}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid-3">
        <div className="stat-card">
          <div style={{ fontSize:"22px", marginBottom:"8px" }}>📦</div>
          <div className="stat-card-value" style={{ color:"var(--accent)" }}>{pendingOrders.length}</div>
          <div className="stat-card-label">active orders</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize:"22px", marginBottom:"8px" }}>✅</div>
          <div className="stat-card-value" style={{ color:"var(--green)" }}>{vendor.totalOrders || 0}</div>
          <div className="stat-card-label">total delivered</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize:"22px", marginBottom:"8px" }}>💰</div>
          <div className="stat-card-value" style={{ color:"var(--gold)" }}>₹{vendor.totalRevenue?.toLocaleString() || 0}</div>
          <div className="stat-card-label">total revenue</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {["overview","orders","products"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "📊 Overview" : t === "orders" ? "📦 Orders" : "🛒 My Products"}
          </button>
        ))}
      </div>

      {/* ── Orders tab ── */}
      {tab === "orders" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No orders yet.</div>
            </div>
          ) : orders.map(o => (
            <OrderCard key={o._id} order={o} onStatusUpdate={updateStatus} />
          ))}
        </div>
      )}

      {/* ── Products tab ── */}
      {tab === "products" && (
        <div className="card">
          <div className="flex-between mb-4">
            <h4 className="font-heading" style={{ fontSize:"20px" }}>My Products ({products.length})</h4>
          </div>

          {/* Lock message if not approved */}
          {!isApproved && (
            <div className="alert alert-error" style={{ marginBottom:16 }}>
              🔒 Product listing is locked until your account is approved by admin.
            </div>
          )}

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">
                {isApproved ? "No products yet. Add some to start selling!" : "Get approved to start listing products."}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {products.map(p => (
                <div key={p._id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"12px 14px", background:"var(--bg3)",
                  border:"1px solid var(--border)", borderRadius:"var(--radius)",
                }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"14px" }}>{p.name}</div>
                    <div style={{ fontSize:"12px", color:"var(--text3)" }}>
                      ₹{p.price} · {p.category} · {p.totalSold || 0} sold
                    </div>
                  </div>
                  <span className={`tag ${p.isAvailable ? "tag-approved" : "tag-rejected"}`}>
                    {p.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}