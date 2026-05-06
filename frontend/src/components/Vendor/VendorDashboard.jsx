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

const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };

const EMPTY_PRODUCT = {
  name:"", description:"", category:"supplement", imageUrl:"",
  price:"", originalPrice:"", unit:"unit", stock:"",
  calories:"", protein:"", carbs:"", fat:"",
  groupBuyEnabled: false, groupBuyThreshold:"10", groupBuyDiscount:"15",
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
    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"14px" }}>{order.client?.user?.name || "Client"}</div>
          <div style={{ fontSize:"12px", color:"var(--text3)" }}>
            {order.client?.user?.email} · {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"var(--green)" }}>₹{order.total}</div>
          <span style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", color: STATUS_COLORS[order.status]||"var(--text3)" }}>● {order.status}</span>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"10px" }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"var(--text2)" }}>
            <span>{item.name} × {item.quantity}</span><span>₹{item.totalPrice}</span>
          </div>
        ))}
      </div>
      {order.deliveryAddress && (
        <div style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"10px" }}>
          📍 {order.deliveryAddress}{order.deliveryPhone && ` · 📞 ${order.deliveryPhone}`}
        </div>
      )}
      <div style={{ display:"flex", gap:"4px", marginBottom:"12px" }}>
        {STATUS_PIPELINE.map(s => (
          <div key={s} style={{ flex:1, height:"4px", borderRadius:"2px",
            background: STATUS_PIPELINE.indexOf(s) <= STATUS_PIPELINE.indexOf(order.status) ? "var(--accent2)" : "var(--border)",
            transition:"background 0.3s" }} />
        ))}
      </div>
      {nextStatus && order.status !== "cancelled" && (
        <button className="btn btn-primary btn-sm btn-full" onClick={advance} disabled={updating}>
          {updating ? "Updating…" : `Mark as ${nextStatus.charAt(0).toUpperCase()+nextStatus.slice(1)} →`}
        </button>
      )}
      {order.status === "delivered" && (
        <div className="alert alert-success" style={{ fontSize:"12px", padding:"8px 12px" }}>✓ Order completed</div>
      )}
      {order.status === "cancelled" && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", padding:"10px 12px", marginTop:"8px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"var(--red)" }}>✕ Order Cancelled by Client</div>
          {order.cancellationReason && (
            <div style={{ fontSize:"12px", color:"var(--text2)", marginTop:"3px" }}>Reason: {order.cancellationReason}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Product Form Modal ─────────────────────────────────────────────────────────
function ProductFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_PRODUCT);
  const [imgError, setImgError] = useState(false);
  const h = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const labelStyle = { fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px", display:"block" };
  const inputStyle = { width:"100%", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 12px", color:"var(--text)", fontSize:"13px", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", overflowY:"auto" }}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"620px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <h3 style={{ fontWeight:700, fontSize:"18px" }}>{initial?._id ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"var(--text3)" }}>✕</button>
        </div>

        {/* Image preview */}
        <div style={{ marginBottom:"20px" }}>
          <label style={labelStyle}>Product Image URL</label>
          <input style={inputStyle} placeholder="https://example.com/product-image.jpg"
            value={form.imageUrl} onChange={h("imageUrl")} onFocus={() => setImgError(false)} />
          {form.imageUrl && !imgError && (
            <div style={{ marginTop:"10px", borderRadius:"10px", overflow:"hidden", height:"160px", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src={form.imageUrl} alt="preview"
                onError={() => setImgError(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
          )}
          {imgError && (
            <div style={{ marginTop:"8px", fontSize:"12px", color:"var(--red)" }}>⚠ Could not load image. Check the URL.</div>
          )}
          {!form.imageUrl && (
            <div style={{ marginTop:"10px", borderRadius:"10px", height:"80px", background:"var(--bg3)", border:"1px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", color:"var(--text3)" }}>
              {CATEGORY_ICONS[form.category] || "📦"}
            </div>
          )}
        </div>

        {/* Basic info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={labelStyle}>Product Name *</label>
            <input style={inputStyle} required placeholder="e.g. Whey Protein Gold" value={form.name} onChange={h("name")} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={h("category")}>
              <option value="supplement">💊 Supplement</option>
              <option value="meal">🥗 Meal</option>
              <option value="equipment">🏋️ Equipment</option>
              <option value="apparel">👕 Apparel</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Unit</label>
            <select style={inputStyle} value={form.unit} onChange={h("unit")}>
              <option value="unit">Unit</option>
              <option value="kg">kg</option>
              <option value="bottle">Bottle</option>
              <option value="pack">Pack</option>
              <option value="serving">Serving</option>
              <option value="piece">Piece</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:"14px" }}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, resize:"vertical" }} rows={3}
            placeholder="What's in this product? Benefits, ingredients, etc."
            value={form.description} onChange={h("description")} />
        </div>

        {/* Pricing & stock */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"14px" }}>
          <div>
            <label style={labelStyle}>Price (₹) *</label>
            <input style={inputStyle} type="number" min="0" placeholder="999" value={form.price} onChange={h("price")} />
          </div>
          <div>
            <label style={labelStyle}>Original Price (₹)</label>
            <input style={inputStyle} type="number" min="0" placeholder="1299 (for discount)" value={form.originalPrice} onChange={h("originalPrice")} />
          </div>
          <div>
            <label style={labelStyle}>Stock</label>
            <input style={inputStyle} type="number" min="0" placeholder="100" value={form.stock} onChange={h("stock")} />
          </div>
        </div>

        {/* Nutrition */}
        <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"10px", padding:"14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"var(--text2)", marginBottom:"10px" }}>🥗 Nutrition Info (optional — for meals & supplements)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px" }}>
            {[["calories","Calories (kcal)"],["protein","Protein (g)"],["carbs","Carbs (g)"],["fat","Fat (g)"]].map(([f,l]) => (
              <div key={f}>
                <label style={labelStyle}>{l}</label>
                <input style={inputStyle} type="number" min="0" placeholder="0" value={form[f]} onChange={h(f)} />
              </div>
            ))}
          </div>
        </div>

        {/* Group buy */}
        <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:"10px", padding:"14px", marginBottom:"24px" }}>
          <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", marginBottom: form.groupBuyEnabled ? "12px" : 0 }}>
            <input type="checkbox" checked={form.groupBuyEnabled} onChange={h("groupBuyEnabled")} style={{ width:"16px", height:"16px", accentColor:"var(--green)" }} />
            <span style={{ fontWeight:700, fontSize:"13px", color:"var(--green)" }}>👥 Enable Group Buy Deal</span>
          </label>
          {form.groupBuyEnabled && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div>
                <label style={labelStyle}>Min. Buyers for Deal</label>
                <input style={inputStyle} type="number" min="2" placeholder="10" value={form.groupBuyThreshold} onChange={h("groupBuyThreshold")} />
              </div>
              <div>
                <label style={labelStyle}>Discount %</label>
                <input style={inputStyle} type="number" min="1" max="90" placeholder="15" value={form.groupBuyDiscount} onChange={h("groupBuyDiscount")} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:"10px" }}>
          <button className="btn btn-accent" style={{ flex:1 }} disabled={saving || !form.name || !form.price}
            onClick={() => onSave(form)}>
            {saving ? "Saving…" : initial?._id ? "Update Product" : "Add Product"}
          </button>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Products Tab ───────────────────────────────────────────────────────────────
function ProductsTab({ products, isApproved, token, onRefresh }) {
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);   // product being edited
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [msg, setMsg]             = useState({ type:"", text:"" });

  const saveProduct = async (form) => {
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      const payload = {
        name: form.name, description: form.description, category: form.category,
        imageUrl: form.imageUrl, price: Number(form.price),
        originalPrice: Number(form.originalPrice) || 0,
        unit: form.unit, stock: Number(form.stock) || 0,
        calories: Number(form.calories) || 0, protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0,
        groupBuyEnabled: form.groupBuyEnabled,
        groupBuyThreshold: Number(form.groupBuyThreshold) || 10,
        groupBuyDiscount: Number(form.groupBuyDiscount) || 15,
      };
      if (editing?._id) {
        await api.put(`/vendors/products/${editing._id}`, payload, { headers:{ Authorization:`Bearer ${token}` } });
        setMsg({ type:"success", text:"Product updated successfully." });
      } else {
        await api.post("/vendors/products", payload, { headers:{ Authorization:`Bearer ${token}` } });
        setMsg({ type:"success", text:"Product added to marketplace!" });
      }
      setShowForm(false); setEditing(null);
      onRefresh();
    } catch(e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed to save product." });
    } finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/vendors/products/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      setMsg({ type:"success", text:"Product deleted." });
      onRefresh();
    } catch { setMsg({ type:"error", text:"Failed to delete product." }); }
    finally { setDeleting(null); }
  };

  return (
    <div className="card">
      <div className="flex-between mb-4">
        <h4 className="font-heading" style={{ fontSize:"20px" }}>My Products ({products.length})</h4>
        {isApproved && (
          <button className="btn btn-accent btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add Product
          </button>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`} style={{ marginBottom:16 }}>
          {msg.text}
          <button onClick={() => setMsg({type:"",text:""})} style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}

      {!isApproved && (
        <div className="alert alert-error" style={{ marginBottom:16 }}>
          🔒 Product listing is locked until your account is approved by admin.
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">
            {isApproved ? 'No products yet. Click "+ Add Product" to get started!' : "Get approved to start listing products."}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {products.map(p => (
            <div key={p._id} style={{ display:"flex", gap:"12px", alignItems:"center", padding:"12px 14px",
              background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              {/* Image thumbnail */}
              <div style={{ width:"52px", height:"52px", borderRadius:"8px", overflow:"hidden", flexShrink:0,
                background:"var(--bg2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                    />
                  : null}
                <span style={{ display: p.imageUrl ? "none" : "flex" }}>{CATEGORY_ICONS[p.category]||"📦"}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{p.name}</div>
                <div style={{ fontSize:"12px", color:"var(--text3)" }}>
                  ₹{p.price}{p.originalPrice > p.price ? ` (was ₹${p.originalPrice})` : ""} · {p.category} · {p.stock} in stock · {p.totalSold||0} sold
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px", flexShrink:0, alignItems:"center" }}>
                <span className={`tag ${p.isAvailable ? "tag-approved" : "tag-rejected"}`}>
                  {p.isAvailable ? "Live" : "Off"}
                </span>
                <button className="btn btn-outline btn-sm"
                  onClick={() => { setEditing(p); setShowForm(true); }}>✏ Edit</button>
                <button className="btn btn-danger btn-sm"
                  onClick={() => deleteProduct(p._id)} disabled={deleting === p._id}>
                  {deleting === p._id ? "…" : "🗑"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormModal
          initial={editing}
          onSave={saveProduct}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
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
  const [regForm, setRegForm] = useState({ businessName:"", businessType:"supplements", description:"", city:"" });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("certificate", file);
    setUploading(true);
    setMsg({ type:"info", text:"Uploading certificate…" });
    try {
      await api.put("/vendors/me/certificate", formData, {
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"multipart/form-data" },
      });
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

  if (loading) return <div className="card loading-screen" style={{ minHeight:"200px" }}><div className="spinner" /></div>;

  if (!vendor) return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize:"22px", marginBottom:"8px" }}>Set Up Your Vendor Profile</h3>
      <p style={{ color:"var(--text2)", fontSize:"14px", marginBottom:"20px" }}>
        List your supplements, meals, or fitness products on FlexFit Marketplace.
      </p>
      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        <div className="form-group">
          <label className="form-label">Business Name *</label>
          <input className="form-input" placeholder="e.g. ProNutrition Labs"
            value={regForm.businessName} onChange={e => setRegForm(f => ({ ...f, businessName: e.target.value }))} />
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
            value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows="2" placeholder="What do you sell?"
            value={regForm.description} onChange={e => setRegForm(f => ({ ...f, description: e.target.value }))} />
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

      {/* Header */}
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

      {/* Alert */}
      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : msg.type === "info" ? "info" : "success"}`}>
          {msg.text}
          <button onClick={() => setMsg({ type:"", text:"" })}
            style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}

      {/* Verification banner */}
      {!isApproved && (
        <div style={{ background:`${vcfg.color}12`, border:`1px solid ${vcfg.color}44`, borderRadius:"var(--radius)", padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:20 }}>{vcfg.icon}</span>
            <span style={{ fontWeight:700, color: vcfg.color, fontSize:15 }}>{vcfg.label}</span>
          </div>
          <p style={{ fontSize:13, color:"var(--text2)", marginBottom: vendor.verificationStatus === "rejected" && vendor.rejectionReason ? 6 : 12 }}>{vcfg.desc}</p>
          {vendor.verificationStatus === "rejected" && vendor.rejectionReason && (
            <div style={{ fontSize:13, color:"#ef4444", marginBottom:12, fontWeight:600 }}>Reason: {vendor.rejectionReason}</div>
          )}
          <div style={{ background:"var(--bg2)", borderRadius:8, padding:"12px 14px" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:8 }}>
              📜 {vendor.certificateUrl ? "Replace License / FSSAI Certificate" : "Upload License / FSSAI Certificate"}
            </div>
            {vendor.certificateUrl && (
              <div style={{ marginBottom:8, fontSize:12, color:"var(--green)" }}>
                ✓ Current file: <a href={vendor.certificateUrl} target="_blank" rel="noreferrer" style={{ color:"var(--accent)", textDecoration:"underline" }}>View uploaded certificate</a>
              </div>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} style={{ fontSize:13, color:"var(--text)" }} />
            {uploading && <div style={{ fontSize:12, color:"var(--text3)", marginTop:6 }}>Uploading…</div>}
          </div>
        </div>
      )}

      {/* Stats */}
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

      {/* Tabs */}
      <div className="tabs">
        {["overview","orders","products"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "📊 Overview" : t === "orders" ? "📦 Orders" : "🛒 My Products"}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {orders.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">No orders yet.</div></div>
            : orders.map(o => <OrderCard key={o._id} order={o} onStatusUpdate={updateStatus} />)
          }
        </div>
      )}

      {tab === "products" && (
        <ProductsTab
          products={products}
          isApproved={isApproved}
          token={token}
          onRefresh={() => {
            api.get("/vendors/products/mine", { headers:{ Authorization:`Bearer ${token}` } })
              .then(r => setProducts(r.value?.data?.products || r.data?.products || []))
              .catch(() => {});
            loadAll();
          }}
        />
      )}
    </div>
  );
}
