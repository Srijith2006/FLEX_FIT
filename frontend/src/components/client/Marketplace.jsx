import { useEffect, useState, useCallback } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORIES = [
  { value: "", label: "All", icon: "🛍️" },
  { value: "supplement", label: "Supplements", icon: "💊" },
  { value: "meal",       label: "Meals",        icon: "🥗" },
  { value: "equipment",  label: "Equipment",    icon: "🏋️" },
  { value: "apparel",    label: "Apparel",      icon: "👕" },
];

const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── Delivery Address Modal ────────────────────────────────────────────────────
function OrderModal({ product, qty, onConfirm, onClose, placing }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!address.trim()) { setError("Delivery address is required."); return; }
    setError("");
    onConfirm({ address, phone });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:"20px", padding:"28px", maxWidth:"440px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.6)" }}>
        <h3 style={{ fontWeight:700, fontSize:"18px", marginBottom:"6px" }}>Confirm Your Order</h3>
        <div style={{ background:"var(--bg3)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:"20px" }}>
          <div style={{ fontWeight:700, fontSize:"14px" }}>{product.name}</div>
          <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>
            {product.vendor?.businessName} · Qty: {qty} · Total: ₹{product.price * qty}
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom:"12px" }}>{error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <div className="form-group">
            <label className="form-label">Delivery Address *</label>
            <textarea className="form-textarea" rows="3"
              placeholder="House/flat no., street, area, city, state, pincode…"
              value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input className="form-input" placeholder="+91 9876543210"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button className="btn btn-accent" style={{ flex:1 }} onClick={submit} disabled={placing}>
              {placing ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Processing…</> : "Proceed to Payment →"}
            </button>
            <button className="btn btn-outline" onClick={onClose} disabled={placing}>Cancel</button>
          </div>
          <div style={{ textAlign:"center", fontSize:"11px", color:"var(--text3)" }}>
            🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onBuy }) {
  const [qty, setQty] = useState(1);
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const groupReady   = product.groupBuyEnabled && product.currentGroupBuyers >= product.groupBuyThreshold;
  const groupNeeded  = product.groupBuyEnabled ? Math.max(0, product.groupBuyThreshold - (product.currentGroupBuyers||0)) : 0;
  const pct          = product.groupBuyEnabled ? Math.min(100, ((product.currentGroupBuyers||0)/product.groupBuyThreshold)*100) : 0;

  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)",
      display:"flex", flexDirection:"column", overflow:"hidden",
      transition:"border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
    >
      {/* Product visual */}
      <div style={{ height:"110px", background:"linear-gradient(135deg,var(--bg3),var(--surface2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"52px", position:"relative", flexShrink:0 }}>
        {CATEGORY_ICONS[product.category] || "📦"}
        {discount > 0 && (
          <div style={{ position:"absolute", top:"8px", left:"8px", background:"var(--red)", color:"#fff", fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"10px" }}>
            -{discount}%
          </div>
        )}
        {groupReady && (
          <div style={{ position:"absolute", top:"8px", right:"8px", background:"var(--green)", color:"#fff", fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"10px" }}>
            🎉 GROUP DEAL
          </div>
        )}
        {product.totalSold > 0 && (
          <div style={{ position:"absolute", bottom:"6px", right:"8px", fontSize:"10px", color:"var(--text3)" }}>
            {product.totalSold} sold
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"14px", flex:1, display:"flex", flexDirection:"column", gap:"8px" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"14px", lineHeight:"1.3", marginBottom:"3px" }}>{product.name}</div>
          <div style={{ fontSize:"11px", color:"var(--text3)" }}>
            {product.vendor?.businessName} · {product.vendor?.city}
          </div>
        </div>

        {product.description && (
          <div style={{ fontSize:"12px", color:"var(--text2)", lineHeight:"1.5" }}>
            {product.description}
          </div>
        )}

        {/* Macros */}
        {(product.calories || product.protein) > 0 && (
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {product.calories > 0 && (
              <span style={{ fontSize:"10px", fontWeight:700, color:"var(--gold)", background:"rgba(245,158,11,0.1)", padding:"2px 7px", borderRadius:"6px" }}>{product.calories} kcal</span>
            )}
            {product.protein > 0 && (
              <span style={{ fontSize:"10px", fontWeight:700, color:"var(--accent2)", background:"rgba(0,112,243,0.1)", padding:"2px 7px", borderRadius:"6px" }}>{product.protein}g protein</span>
            )}
            {product.carbs > 0 && (
              <span style={{ fontSize:"10px", fontWeight:700, color:"var(--green)", background:"rgba(16,185,129,0.1)", padding:"2px 7px", borderRadius:"6px" }}>{product.carbs}g carbs</span>
            )}
          </div>
        )}

        {/* Group buying progress */}
        {product.groupBuyEnabled && !groupReady && (
          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:"8px", padding:"8px 10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", marginBottom:"5px" }}>
              <span style={{ color:"var(--green)", fontWeight:700 }}>👥 Group Deal — {product.groupBuyDiscount}% off</span>
              <span style={{ color:"var(--text3)" }}>{groupNeeded} more needed</span>
            </div>
            <div style={{ height:"4px", background:"var(--border)", borderRadius:"2px" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:"var(--green)", borderRadius:"2px", transition:"width 0.3s" }} />
            </div>
          </div>
        )}

        <div style={{ marginTop:"auto", paddingTop:"8px" }}>
          {/* Price */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"var(--accent)", lineHeight:1 }}>₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span style={{ fontSize:"13px", color:"var(--text3)", textDecoration:"line-through" }}>₹{product.originalPrice}</span>
            )}
            <span style={{ fontSize:"11px", color:"var(--text3)", marginLeft:"auto" }}>/ {product.unit||"unit"}</span>
          </div>

          {/* Qty + Order button */}
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"4px 8px", flexShrink:0 }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:"16px", lineHeight:1, padding:"0 2px" }}>−</button>
              <span style={{ fontSize:"14px", fontWeight:700, minWidth:"18px", textAlign:"center" }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:"16px", lineHeight:1, padding:"0 2px" }}>+</button>
            </div>
            <button
              className="btn btn-accent"
              style={{ flex:1, fontSize:"13px", padding:"9px 12px" }}
              onClick={() => onBuy(product, qty)}
            >
              🛒 Order · ₹{product.price * qty}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trainer Recommendations ───────────────────────────────────────────────────
function TrainerRecommendedSection({ token, onBuy }) {
  const [recs, setRecs] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [programId, setProgramId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/programs/enrolled", { headers:{ Authorization:`Bearer ${token}` } });
        const enrs = res.data.enrollments || [];
        setEnrollments(enrs);
        if (enrs.length > 0) setProgramId(enrs[0].program?._id);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  useEffect(() => {
    if (!programId) return;
    api.get(`/marketplace/recommendations/${programId}`)
      .then(r => setRecs(r.data.recommendations || []))
      .catch(() => setRecs([]));
  }, [programId]);

  if (loading || recs.length === 0) return null;

  return (
    <div style={{ marginBottom:"8px" }}>
      <div className="card" style={{ border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.03)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:"17px", color:"var(--gold)" }}>⭐ Trainer Recommended</div>
            <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>Hand-picked by your trainer for your program</div>
          </div>
          {enrollments.length > 1 && (
            <select className="form-select" style={{ maxWidth:"180px", fontSize:"12px" }}
              value={programId} onChange={e => setProgramId(e.target.value)}>
              {enrollments.map(e => (
                <option key={e.program?._id} value={e.program?._id}>{e.program?.title}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {recs.map(rec => (
            <div key={rec._id} style={{ display:"flex", gap:"14px", alignItems:"center", padding:"12px 14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              <div style={{ fontSize:"28px", flexShrink:0 }}>{CATEGORY_ICONS[rec.product?.category]||"📦"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{rec.product?.name}</div>
                <div style={{ fontSize:"12px", color:"var(--text2)", marginTop:"2px" }}>{rec.note || "Recommended by your trainer"}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                  {rec.product?.vendor?.businessName} · {rec.product?.vendor?.city}
                </div>
              </div>
              <div style={{ flexShrink:0, textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"var(--accent)" }}>₹{rec.product?.price}</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop:"6px", fontSize:"11px" }}
                  onClick={() => rec.product && onBuy(rec.product, 1)}>
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── My Orders ─────────────────────────────────────────────────────────────────
function MyOrders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-screen" style={{minHeight:"80px"}}><div className="spinner"></div></div>;
  if (orders.length === 0) return (
    <div className="empty-state" style={{padding:"24px"}}>
      <div className="empty-state-icon">📦</div>
      <div className="empty-state-text">No orders yet.</div>
    </div>
  );

  const STATUS_COLORS = { pending:"var(--gold)", confirmed:"var(--accent2)", preparing:"var(--accent)", shipped:"var(--accent3)", delivered:"var(--green)", cancelled:"var(--red)" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {orders.map(o => (
        <div key={o._id} style={{ padding:"14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:"13px", marginBottom:"4px" }}>
              {o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}
            </div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>
              {o.vendor?.businessName} · {new Date(o.createdAt).toLocaleDateString("en-IN")}
            </div>
            {o.deliveryAddress && (
              <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"3px" }}>📍 {o.deliveryAddress.slice(0,60)}{o.deliveryAddress.length>60?"…":""}</div>
            )}
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"var(--accent)" }}>₹{o.total}</div>
            <span style={{ fontSize:"11px", fontWeight:700, color: STATUS_COLORS[o.status]||"var(--text3)", textTransform:"uppercase" }}>
              {o.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Marketplace ──────────────────────────────────────────────────────────
export default function Marketplace() {
  const { token, user } = useAuth();
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState("");
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("shop");  // "shop" | "orders"
  const [orderModal, setOrderModal] = useState(null);    // { product, qty }
  const [placing, setPlacing]       = useState(false);
  const [msg, setMsg]               = useState({ type:"", text:"" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search)   params.search   = search;
      const res = await api.get("/marketplace/products", { params });
      setProducts(res.data.products || []);
    } catch {
      setMsg({ type:"error", text:"Failed to load products. Please refresh." });
    } finally { setLoading(false); }
  }, [category, search]);

  useEffect(() => { load(); }, [category]);

  const handleBuy = (product, qty) => {
    setMsg({ type:"", text:"" });
    setOrderModal({ product, qty });
  };

  const handleConfirmOrder = async ({ address, phone }) => {
    if (!orderModal) return;
    const { product, qty } = orderModal;
    setPlacing(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setMsg({ type:"error", text:"Payment gateway failed to load. Check your connection." });
        setPlacing(false); return;
      }

      const { data } = await api.post("/orders", {
        items: [{ productId: product._id, quantity: qty }],
        deliveryAddress: address,
        deliveryPhone: phone,
      }, { headers:{ Authorization:`Bearer ${token}` } });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency || "INR",
        name:        "FlexFit Marketplace",
        description: `${product.name} × ${qty}`,
        order_id:    data.orderId,
        prefill:     { name: user?.name||"", email: user?.email||"" },
        theme:       { color: "#0070f3" },
        handler: async (response) => {
          try {
            await api.post("/orders/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderDbId:           data.orderDbId,
            }, { headers:{ Authorization:`Bearer ${token}` } });
            setMsg({ type:"success", text:`✅ Order placed successfully! Payment ID: ${response.razorpay_payment_id}. Track in My Orders.` });
            setOrderModal(null);
            setActiveTab("orders");
          } catch {
            setMsg({ type:"error", text:"Payment verified but order confirmation failed. Contact support." });
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", r => {
        setMsg({ type:"error", text:`Payment failed: ${r.error?.description||"Unknown error"}` });
        setPlacing(false);
      });
      rzp.open();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Could not place order. Please try again." });
      setPlacing(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab==="shop"?"active":""}`} onClick={() => setActiveTab("shop")}>🛍️ Shop</button>
        <button className={`tab-btn ${activeTab==="orders"?"active":""}`} onClick={() => setActiveTab("orders")}>📦 My Orders</button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`} style={{ position:"sticky", top:"80px", zIndex:10 }}>
          {msg.text}
          <button onClick={() => setMsg({type:"",text:""})} style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit", fontSize:"16px" }}>✕</button>
        </div>
      )}

      {activeTab === "orders" ? (
        <div className="card">
          <h3 className="font-heading" style={{ fontSize:"20px", marginBottom:"16px" }}>My Orders</h3>
          <MyOrders token={token} />
        </div>
      ) : (
        <>
          {/* Trainer recommendations for clients */}
          {user?.role === "client" && <TrainerRecommendedSection token={token} onBuy={handleBuy} />}

          {/* Search + filters */}
          <div className="card" style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
              <input className="form-input" placeholder="Search products…" value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key==="Enter" && load()}
                style={{ maxWidth:"220px" }} />
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c.value}
                    className={`btn btn-sm ${category===c.value?"btn-primary":"btn-outline"}`}
                    onClick={() => setCategory(c.value)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-outline btn-sm" onClick={load} style={{ marginLeft:"auto" }}>↻ Refresh</button>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="loading-screen" style={{ minHeight:"260px" }}>
              <div className="spinner"></div><span>Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛍️</div>
              <div className="empty-state-text">No products found. Try a different category.</div>
            </div>
          ) : (
            <div className="grid-3">
              {products.map(p => (
                <ProductCard key={p._id} product={p} onBuy={handleBuy} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Order confirmation modal */}
      {orderModal && (
        <OrderModal
          product={orderModal.product}
          qty={orderModal.qty}
          onConfirm={handleConfirmOrder}
          onClose={() => { setOrderModal(null); setPlacing(false); }}
          placing={placing}
        />
      )}
    </div>
  );
}