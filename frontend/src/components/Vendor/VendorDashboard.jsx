import { useEffect, useState, useCallback, useRef } from "react";
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
    <div style={{ background:"var(--bg3)", border:`1px solid ${order.status === "cancelled" ? "rgba(239,68,68,0.25)" : "var(--border)"}`, borderRadius:"var(--radius)", padding:"16px" }}>
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
          {order.cancelledAt && (
            <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
              Cancelled on: {new Date(order.cancelledAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ vendor, orders, products, onTabChange }) {
  const delivered   = orders.filter(o => o.status === "delivered");
  const pending     = orders.filter(o => ["pending","confirmed","preparing","shipped"].includes(o.status));
  const cancelled   = orders.filter(o => o.status === "cancelled");
  const totalRevenue = vendor.totalRevenue || 0;
  const topProducts = [...products].sort((a,b) => (b.totalSold||0) - (a.totalSold||0)).slice(0,3);
  const recentOrders = [...orders].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
  const lowStock    = products.filter(p => p.stock <= 10 && p.stock > 0);
  const outOfStock  = products.filter(p => p.stock === 0);

  // Revenue breakdown by category
  const categoryRevenue = {};
  delivered.forEach(o => {
    o.items?.forEach(item => {
      const product = products.find(p => p._id === (item.product?._id || item.product));
      const cat = product?.category || "other";
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.totalPrice;
    });
  });

  const avgOrderValue = delivered.length > 0
    ? Math.round(delivered.reduce((s,o) => s + o.total, 0) / delivered.length) : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* ── Performance KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
        {[
          { icon:"💰", label:"Total Revenue",    value:`₹${totalRevenue.toLocaleString()}`, color:"var(--gold)" },
          { icon:"📦", label:"Active Orders",     value:pending.length,    color:"var(--accent)" },
          { icon:"✅", label:"Delivered Orders",  value:delivered.length,  color:"var(--green)" },
          { icon:"📊", label:"Avg Order Value",   value:`₹${avgOrderValue}`, color:"var(--accent2)" },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize:"22px", marginBottom:"6px" }}>{k.icon}</div>
            <div className="stat-card-value" style={{ color:k.color, fontSize:"22px" }}>{k.value}</div>
            <div className="stat-card-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

        {/* ── Recent Orders ── */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"16px" }}>🕐 Recent Orders</div>
            <button className="btn btn-outline btn-sm" onClick={() => onTabChange("orders")}>View All →</button>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:"13px", textAlign:"center", padding:"20px 0" }}>No orders yet</div>
          ) : recentOrders.map(o => (
            <div key={o._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:600 }}>
                  {o.items?.map(i => i.name).join(", ").slice(0,30)}…
                </div>
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                  {o.client?.user?.name} · {new Date(o.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, color:"var(--green)", fontSize:"14px" }}>₹{o.total}</div>
                <span style={{ fontSize:"10px", fontWeight:700, textTransform:"uppercase",
                  color: STATUS_COLORS[o.status] }}>● {o.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Top Products ── */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"16px" }}>🏆 Top Products</div>
            <button className="btn btn-outline btn-sm" onClick={() => onTabChange("products")}>Manage →</button>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:"13px", textAlign:"center", padding:"20px 0" }}>No products listed yet</div>
          ) : topProducts.map((p, i) => (
            <div key={p._id} style={{ display:"flex", alignItems:"center", gap:"12px",
              padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"8px", overflow:"hidden", flexShrink:0,
                background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : CATEGORY_ICONS[p.category]||"📦"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"13px", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)" }}>₹{p.price} · {p.totalSold||0} sold</div>
              </div>
              <div style={{ fontSize:"18px", fontWeight:700, color:"var(--gold)" }}>#{i+1}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

        {/* ── Inventory Alerts ── */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"14px" }}>⚠️ Inventory Alerts</div>
          {outOfStock.length === 0 && lowStock.length === 0 ? (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px",
              background:"rgba(16,185,129,0.08)", borderRadius:"8px", border:"1px solid rgba(16,185,129,0.2)" }}>
              <span style={{ fontSize:"20px" }}>✅</span>
              <span style={{ fontSize:"13px", color:"var(--green)" }}>All products are well stocked!</span>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {outOfStock.map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", background:"rgba(239,68,68,0.08)", borderRadius:"8px",
                  border:"1px solid rgba(239,68,68,0.2)" }}>
                  <span style={{ fontSize:"13px", fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:"11px", fontWeight:700, color:"var(--red)" }}>OUT OF STOCK</span>
                </div>
              ))}
              {lowStock.map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", background:"rgba(245,158,11,0.08)", borderRadius:"8px",
                  border:"1px solid rgba(245,158,11,0.2)" }}>
                  <span style={{ fontSize:"13px", fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:"11px", fontWeight:700, color:"var(--gold)" }}>Only {p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Order Status Breakdown ── */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"14px" }}>📈 Order Breakdown</div>
          {orders.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:"13px", textAlign:"center", padding:"20px 0" }}>No orders yet</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                { label:"Delivered", count:delivered.length,  color:"var(--green)",   pct: Math.round(delivered.length/orders.length*100) },
                { label:"Active",    count:pending.length,    color:"var(--accent)",  pct: Math.round(pending.length/orders.length*100) },
                { label:"Cancelled", count:cancelled.length,  color:"var(--red)",     pct: Math.round(cancelled.length/orders.length*100) },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
                    <span style={{ color:"var(--text2)", fontWeight:600 }}>{row.label}</span>
                    <span style={{ color:row.color, fontWeight:700 }}>{row.count} ({row.pct}%)</span>
                  </div>
                  <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px" }}>
                    <div style={{ height:"100%", width:`${row.pct}%`, background:row.color,
                      borderRadius:"3px", transition:"width 0.5s" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop:"4px", paddingTop:"10px", borderTop:"1px solid var(--border)",
                display:"flex", justifyContent:"space-between", fontSize:"12px" }}>
                <span style={{ color:"var(--text3)" }}>Total Orders</span>
                <span style={{ fontWeight:700 }}>{orders.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card">
        <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"14px" }}>⚡ Quick Actions</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          <button className="btn btn-accent btn-sm" onClick={() => onTabChange("products")}>
            + Add New Product
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => onTabChange("orders")}>
            📦 View All Orders
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => onTabChange("products")}>
            🛒 Manage Products
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Product Form Modal ─────────────────────────────────────────────────────────
function ProductFormModal({ initial, onSave, onClose, saving, token }) {
  const [form, setForm] = useState(initial || EMPTY_PRODUCT);
  const [imgLoaded, setImgLoaded] = useState(!!initial?.imageUrl);
  const [imgError, setImgError]   = useState(false);
  const h = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const labelStyle = { fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px", display:"block" };
  const inputStyle = { width:"100%", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 12px", color:"var(--text)", fontSize:"13px", outline:"none", boxSizing:"border-box" };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, imageUrl: val }));
    setImgLoaded(false);
    setImgError(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", overflowY:"auto" }}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"620px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <h3 style={{ fontWeight:700, fontSize:"18px" }}>{initial?._id ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"var(--text3)" }}>✕</button>
        </div>

        {/* Image — URL input with live preview */}
        <div style={{ marginBottom:"20px" }}>
          <label style={labelStyle}>Product Image URL</label>

          {/* Live preview box */}
          <div style={{ marginBottom:"10px", borderRadius:"10px", overflow:"hidden", height:"180px",
            background:"var(--bg3)", border:`1px dashed ${imgLoaded ? "var(--accent)" : "var(--border)"}`,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            {form.imageUrl && !imgError ? (
              <img
                src={form.imageUrl}
                alt="preview"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                onLoad={() => { setImgLoaded(true); setImgError(false); }}
                onError={() => { setImgLoaded(false); setImgError(true); }}
              />
            ) : (
              <div style={{ textAlign:"center", color:"var(--text3)", padding:"16px" }}>
                <div style={{ fontSize:"36px", marginBottom:"6px" }}>{CATEGORY_ICONS[form.category] || "📦"}</div>
                <div style={{ fontSize:"12px" }}>
                  {imgError
                    ? "Cannot preview this URL — but it will still be saved and may show in marketplace"
                    : "Paste an image URL below to preview"}
                </div>
              </div>
            )}
            {imgLoaded && (
              <div style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(16,185,129,0.9)",
                borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
                ✓ Preview loaded
              </div>
            )}
          </div>

          <input style={inputStyle}
            placeholder="Paste image URL — e.g. https://i.imgur.com/abc.jpg or right-click image → Copy image address"
            value={form.imageUrl}
            onChange={handleUrlChange} />

          <div style={{ marginTop:"6px", fontSize:"11px", color:"var(--text3)" }}>
            💡 Right-click any image on Google Images → <b>Copy image address</b> → paste above
          </div>
          {form.imageUrl && imgLoaded && (
            <div style={{ marginTop:"4px", fontSize:"12px", color:"var(--green)", fontWeight:600 }}>✓ Image looks good!</div>
          )}
          {form.imageUrl && imgError && (
            <div style={{ marginTop:"4px", fontSize:"12px", color:"var(--gold)" }}>⚠ Preview blocked by source site — URL saved, will try to display in marketplace</div>
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
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"14px" }}>
          <div><label style={labelStyle}>Price (₹) *</label><input style={inputStyle} type="number" min="0" placeholder="999" value={form.price} onChange={h("price")} /></div>
          <div><label style={labelStyle}>Original Price (₹)</label><input style={inputStyle} type="number" min="0" placeholder="1299" value={form.originalPrice} onChange={h("originalPrice")} /></div>
          <div><label style={labelStyle}>Stock</label><input style={inputStyle} type="number" min="0" placeholder="100" value={form.stock} onChange={h("stock")} /></div>
        </div>

        {/* Nutrition */}
        <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"10px", padding:"14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"var(--text2)", marginBottom:"10px" }}>🥗 Nutrition Info (optional)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px" }}>
            {[["calories","Calories (kcal)"],["protein","Protein (g)"],["carbs","Carbs (g)"],["fat","Fat (g)"]].map(([f,l]) => (
              <div key={f}><label style={labelStyle}>{l}</label><input style={inputStyle} type="number" min="0" placeholder="0" value={form[f]} onChange={h(f)} /></div>
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
              <div><label style={labelStyle}>Min. Buyers for Deal</label><input style={inputStyle} type="number" min="2" placeholder="10" value={form.groupBuyThreshold} onChange={h("groupBuyThreshold")} /></div>
              <div><label style={labelStyle}>Discount %</label><input style={inputStyle} type="number" min="1" max="90" placeholder="15" value={form.groupBuyDiscount} onChange={h("groupBuyDiscount")} /></div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button className="btn btn-accent" style={{ flex:1 }} disabled={saving || !form.name || !form.price} onClick={() => onSave(form)}>
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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg]           = useState({ type:"", text:"" });

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
          <button className="btn btn-accent btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>+ Add Product</button>
        )}
      </div>
      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`} style={{ marginBottom:16 }}>
          {msg.text}
          <button onClick={() => setMsg({type:"",text:""})} style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}
      {!isApproved && <div className="alert alert-error" style={{ marginBottom:16 }}>🔒 Product listing is locked until your account is approved by admin.</div>}
      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">{isApproved ? 'No products yet. Click "+ Add Product" to get started!' : "Get approved to start listing products."}</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {products.map(p => (
            <div key={p._id} style={{ display:"flex", gap:"12px", alignItems:"center", padding:"12px 14px",
              background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"8px", overflow:"hidden", flexShrink:0,
                background:"var(--bg2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e => { e.target.style.display="none"; }}/>
                  : CATEGORY_ICONS[p.category]||"📦"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{p.name}</div>
                <div style={{ fontSize:"12px", color:"var(--text3)" }}>
                  ₹{p.price}{p.originalPrice > p.price ? ` (was ₹${p.originalPrice})` : ""} · {p.category} · {p.stock} in stock · {p.totalSold||0} sold
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px", flexShrink:0, alignItems:"center" }}>
                <span className={`tag ${p.isAvailable ? "tag-approved" : "tag-rejected"}`}>{p.isAvailable ? "Live" : "Off"}</span>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditing(p); setShowForm(true); }}>✏ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p._id)} disabled={deleting === p._id}>
                  {deleting === p._id ? "…" : "🗑"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <ProductFormModal initial={editing} onSave={saveProduct}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving} token={token} />
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
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  // ── Fetch only orders (used for polling — no loading spinner) ──────────────
  const refreshOrders = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get("/orders/vendor", { headers:{ Authorization:`Bearer ${token}` } });
      setOrders(res.data.orders || []);
      setLastRefreshed(new Date());
    } catch {}
    finally { if (!silent) setRefreshing(false); }
  }, [token]);

  // ── Full load (vendor + orders + products) ─────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [vRes, oRes, pRes] = await Promise.allSettled([
        api.get("/vendors/me",            { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/orders/vendor",         { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/vendors/products/mine", { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      if (vRes.status === "fulfilled") setVendor(vRes.value.data.vendor);
      if (oRes.status === "fulfilled") { setOrders(oRes.value.data.orders || []); setLastRefreshed(new Date()); }
      if (pRes.status === "fulfilled") setProducts(pRes.value.data.products || []);
    } catch {} finally { setLoading(false); }
  }, [token]);

  // ── On mount: full load + start 30s polling for orders ────────────────────
  useEffect(() => {
    loadAll();
    // Poll orders every 30 seconds so cancellations appear automatically
    pollRef.current = setInterval(() => refreshOrders(true), 30_000);
    return () => clearInterval(pollRef.current);
  }, [loadAll, refreshOrders]);

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
        headers: { Authorization:`Bearer ${token}` },
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
      <p style={{ color:"var(--text2)", fontSize:"14px", marginBottom:"20px" }}>List your supplements, meals, or fitness products on FlexFit Marketplace.</p>
      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        <div className="form-group">
          <label className="form-label">Business Name *</label>
          <input className="form-input" placeholder="e.g. ProNutrition Labs" value={regForm.businessName} onChange={e => setRegForm(f => ({ ...f, businessName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Business Type</label>
          <select className="form-select" value={regForm.businessType} onChange={e => setRegForm(f => ({ ...f, businessType: e.target.value }))}>
            <option value="supplements">Supplements</option>
            <option value="meal_kitchen">Meal Kitchen</option>
            <option value="equipment">Equipment</option>
            <option value="apparel">Apparel</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" placeholder="e.g. Mumbai" value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows="2" placeholder="What do you sell?" value={regForm.description} onChange={e => setRegForm(f => ({ ...f, description: e.target.value }))} />
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
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

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

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : msg.type === "info" ? "info" : "success"}`}>
          {msg.text}
          <button onClick={() => setMsg({ type:"", text:"" })} style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}

      {/* Verification banner */}
      {!isApproved && (
        <div style={{ background:`${vcfg.color}12`, border:`1px solid ${vcfg.color}44`, borderRadius:"var(--radius)", padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:20 }}>{vcfg.icon}</span>
            <span style={{ fontWeight:700, color:vcfg.color, fontSize:15 }}>{vcfg.label}</span>
          </div>
          <p style={{ fontSize:13, color:"var(--text2)", marginBottom:12 }}>{vcfg.desc}</p>
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

      {/* Stats row — now includes cancelled count */}
      <div className="grid-3" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
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
          <div style={{ fontSize:"22px", marginBottom:"8px" }}>🚫</div>
          <div className="stat-card-value" style={{ color:"var(--red)" }}>{cancelledOrders.length}</div>
          <div className="stat-card-label">cancelled</div>
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

      {tab === "overview" && (
        <OverviewTab vendor={vendor} orders={orders} products={products} onTabChange={setTab} />
      )}

      {tab === "orders" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

          {/* ── Orders toolbar: filter tabs + refresh ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ fontSize:"12px", color:"var(--text3)" }}>
              {lastRefreshed && `Last updated: ${lastRefreshed.toLocaleTimeString("en-IN")} · auto-refreshes every 30s`}
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => refreshOrders(false)}
              disabled={refreshing}
              style={{ fontSize:"12px" }}
            >
              {refreshing
                ? <><span className="spinner" style={{ width:"11px", height:"11px", borderTopColor:"var(--accent)" }}></span> Refreshing…</>
                : "↻ Refresh Orders"}
            </button>
          </div>

          {/* Cancelled orders alert banner — only if any exist */}
          {cancelledOrders.length > 0 && (
            <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius)", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
              <span style={{ fontSize:"20px" }}>🚫</span>
              <div>
                <div style={{ fontWeight:700, fontSize:"13px", color:"var(--red)" }}>
                  {cancelledOrders.length} cancelled order{cancelledOrders.length > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize:"12px", color:"var(--text2)", marginTop:"2px" }}>
                  Review the cancellation reasons below and restock if needed.
                </div>
              </div>
            </div>
          )}

          {orders.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">No orders yet.</div></div>
            : orders.map(o => <OrderCard key={o._id} order={o} onStatusUpdate={updateStatus} />)
          }
        </div>
      )}

      {tab === "products" && (
        <ProductsTab products={products} isApproved={isApproved} token={token} onRefresh={loadAll} />
      )}
    </div>
  );
}