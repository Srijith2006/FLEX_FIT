import { useEffect, useState, useCallback } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORIES = [
  { value:"",           label:"All",         icon:"🛍️" },
  { value:"supplement", label:"Supplements", icon:"💊" },
  { value:"meal",       label:"Meals",       icon:"🥗" },
  { value:"equipment",  label:"Equipment",   icon:"🏋️" },
  { value:"apparel",    label:"Apparel",     icon:"👕" },
];
const CAT_ICON = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── Star Rating Widget ────────────────────────────────────────────────────────
function StarRating({ value, onRate, size = 14 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:"2px" }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={onRate ? () => onRate(n) : undefined}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => onRate && setHover(0)}
          style={{
            fontSize:`${size}px`, cursor: onRate ? "pointer" : "default",
            color: n <= (hover || value) ? "var(--gold)" : "var(--border2)",
            transition:"color 0.1s",
          }}>★</span>
      ))}
    </div>
  );
}

// ── Delivery Address Modal ────────────────────────────────────────────────────
function OrderModal({ product, qty, onConfirm, onClose, placing }) {
  const [address, setAddress] = useState("");
  const [phone,   setPhone]   = useState("");
  const [error,   setError]   = useState("");

  const submit = () => {
    if (!address.trim()) { setError("Delivery address is required."); return; }
    setError(""); onConfirm({ address, phone });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:"20px", padding:"28px", maxWidth:"440px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.6)" }}>
        <h3 style={{ fontWeight:700, fontSize:"18px", marginBottom:"6px" }}>Confirm Your Order</h3>
        <div style={{ background:"var(--bg3)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:"20px", display:"flex", gap:"12px", alignItems:"center" }}>
          <span style={{ fontSize:"28px" }}>{CAT_ICON[product.category]||"📦"}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:"14px" }}>{product.name}</div>
            <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>
              {product.vendor?.businessName} · Qty: {qty} ·
              <strong style={{ color:"var(--accent)" }}> ₹{product.price * qty}</strong>
            </div>
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom:"12px" }}>{error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <div className="form-group">
            <label className="form-label">Delivery Address *</label>
            <textarea className="form-textarea" rows="3"
              placeholder="House/flat no., street, area, city, pincode…"
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
            🔒 Secured by Razorpay · UPI, Cards, Net Banking, Wallets
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Order Modal ────────────────────────────────────────────────────────
const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time is too long",
  "Changed my mind",
  "Duplicate order",
  "Product no longer needed",
  "Other",
];

function CancelOrderModal({ order, onConfirm, onClose, cancelling }) {
  const [reason,    setReason]    = useState("");
  const [otherText, setOtherText] = useState("");
  const [error,     setError]     = useState("");

  const submit = () => {
    const finalReason = reason === "Other" ? otherText.trim() : reason;
    if (!reason)                            { setError("Please select a reason."); return; }
    if (reason === "Other" && !otherText.trim()) { setError("Please describe your reason."); return; }
    setError("");
    onConfirm(order._id, finalReason);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:"20px", padding:"28px", maxWidth:"440px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
          <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"rgba(239,68,68,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
            🚫
          </div>
          <div>
            <h3 style={{ fontWeight:700, fontSize:"17px", margin:0 }}>Cancel Order</h3>
            <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
              #{String(order._id).slice(-8).toUpperCase()} · {order.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}
            </div>
          </div>
        </div>

        {/* Warning note */}
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.22)", borderRadius:"10px", padding:"10px 13px", marginBottom:"18px", fontSize:"12px", color:"var(--text2)" }}>
          ⚠️ Cancellations are only allowed for orders that haven't been shipped yet. Refunds (if applicable) will be processed within 5–7 business days.
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom:"12px" }}>{error}</div>}

        {/* Reason selection */}
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
          <label style={{ fontSize:"13px", fontWeight:600, color:"var(--text2)" }}>Why are you cancelling? *</label>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {CANCEL_REASONS.map(r => (
              <label key={r} style={{
                display:"flex", alignItems:"center", gap:"10px",
                padding:"10px 13px", borderRadius:"10px", cursor:"pointer",
                background: reason === r ? "rgba(239,68,68,0.08)" : "var(--bg3)",
                border: `1px solid ${reason === r ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
                transition:"background 0.15s, border-color 0.15s",
              }}>
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={reason === r}
                  onChange={() => { setReason(r); setError(""); }}
                  style={{ accentColor:"var(--red)", width:"15px", height:"15px", flexShrink:0 }}
                />
                <span style={{ fontSize:"13px", color:"var(--text)" }}>{r}</span>
              </label>
            ))}
          </div>

          {reason === "Other" && (
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Please describe your reason…"
              value={otherText}
              onChange={e => { setOtherText(e.target.value); setError(""); }}
              style={{ marginTop:"4px" }}
            />
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:"10px" }}>
          <button
            className="btn btn-sm"
            style={{ flex:1, background:"var(--red)", color:"#fff", fontWeight:700, fontSize:"13px", padding:"10px" }}
            onClick={submit}
            disabled={cancelling}
          >
            {cancelling
              ? <><span className="spinner" style={{borderTopColor:"#fff", width:"12px", height:"12px"}}></span> Cancelling…</>
              : "Confirm Cancellation"}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={cancelling} style={{ flexShrink:0 }}>
            Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onBuy, onRate, userRatings }) {
  const [qty, setQty] = useState(1);
  const [ratingDone, setRatingDone] = useState(userRatings?.[product._id] || false);

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const handleRate = async (rating) => {
    await onRate(product._id, rating);
    setRatingDone(true);
  };

  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)",
      display:"flex", flexDirection:"column", overflow:"hidden",
      transition:"border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 40px rgba(0,112,243,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
    >
      {/* Image */}
      <div style={{ height:"190px", background:"linear-gradient(145deg,var(--bg3) 0%,var(--surface2) 100%)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0, overflow:"hidden" }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center", display:"block", padding:"12px" }}
            onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
          />
        ) : null}
        <div style={{ display: product.imageUrl ? "none" : "flex", width:"100%", height:"100%",
          alignItems:"center", justifyContent:"center", fontSize:"52px" }}>
          {CAT_ICON[product.category]||"📦"}
        </div>
        {discount > 0 && <div style={{ position:"absolute", top:"10px", left:"10px", background:"var(--red)", color:"#fff", fontSize:"10px", fontWeight:700, padding:"3px 9px", borderRadius:"20px", letterSpacing:"0.4px" }}>−{discount}%</div>}
      </div>

      <div style={{ padding:"16px", flex:1, display:"flex", flexDirection:"column", gap:"10px" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"15px", lineHeight:"1.3", marginBottom:"4px" }}>{product.name}</div>
          <div style={{ fontSize:"11px", color:"var(--text3)", display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"var(--accent)", display:"inline-block", opacity:0.6 }}></span>
            {product.vendor?.businessName} · {product.vendor?.city}
          </div>
        </div>

        {product.description && (
          <div style={{ fontSize:"12px", color:"var(--text2)", lineHeight:"1.6", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{product.description}</div>
        )}

        {/* Macros */}
        {(product.calories > 0 || product.protein > 0) && (
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {product.calories > 0 && <span style={{ fontSize:"10px", fontWeight:700, color:"var(--gold)", background:"rgba(245,158,11,0.1)", padding:"2px 6px", borderRadius:"5px" }}>{product.calories} kcal</span>}
            {product.protein  > 0 && <span style={{ fontSize:"10px", fontWeight:700, color:"var(--accent2)", background:"rgba(0,112,243,0.1)", padding:"2px 6px", borderRadius:"5px" }}>{product.protein}g protein</span>}
            {product.carbs    > 0 && <span style={{ fontSize:"10px", fontWeight:700, color:"var(--green)", background:"rgba(16,185,129,0.1)", padding:"2px 6px", borderRadius:"5px" }}>{product.carbs}g carbs</span>}
          </div>
        )}

        {/* Ratings + buyers */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <StarRating value={Math.round(product.avgRating||0)} />
            <span style={{ fontSize:"11px", color:"var(--text3)" }}>
              {product.avgRating > 0 ? Number(product.avgRating).toFixed(1) : "No ratings"}
              {product.totalRatings > 0 && ` (${product.totalRatings})`}
            </span>
          </div>
          {product.totalSold > 0 && (
            <span style={{ fontSize:"10px", color:"var(--text3)" }}>🛒 {product.totalSold} bought</span>
          )}
        </div>

        {/* Rate this product */}
        {!ratingDone ? (
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"11px", color:"var(--text3)" }}>Rate:</span>
            <StarRating value={0} onRate={handleRate} />
          </div>
        ) : (
          <div style={{ fontSize:"11px", color:"var(--gold)" }}>⭐ Thanks for rating!</div>
        )}

        {/* Price + Order */}
        <div style={{ marginTop:"auto", paddingTop:"8px", borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"var(--accent)", lineHeight:1 }}>₹{product.price}</span>
            {product.originalPrice > product.price && <span style={{ fontSize:"13px", color:"var(--text3)", textDecoration:"line-through" }}>₹{product.originalPrice}</span>}
            <span style={{ fontSize:"11px", color:"var(--text3)", marginLeft:"auto" }}>/{product.unit||"unit"}</span>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"10px", overflow:"hidden", flexShrink:0 }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ background:"none", border:"none", borderRight:"1px solid var(--border)", color:"var(--text2)", cursor:"pointer", fontSize:"16px", lineHeight:1, padding:"7px 12px" }}>−</button>
              <span style={{ fontSize:"14px", fontWeight:700, minWidth:"28px", textAlign:"center" }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ background:"none", border:"none", borderLeft:"1px solid var(--border)", color:"var(--text2)", cursor:"pointer", fontSize:"16px", lineHeight:1, padding:"7px 12px" }}>+</button>
            </div>
            <button
              className="btn btn-accent"
              style={{ flex:1, fontSize:"13px", padding:"9px 12px", borderRadius:"10px", fontWeight:700 }}
              onClick={() => onBuy(product, qty)}>
              Order · ₹{product.price * qty}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trainer Recommendations ───────────────────────────────────────────────────
function TrainerRecommendedSection({ token, onBuy }) {
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the new /recommendations/mine endpoint — fetches all enrolled programs at once
    api.get("/marketplace/recommendations/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setRecs(r.data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || recs.length === 0) return null;

  // Group by program
  const byProgram = {};
  recs.forEach(r => {
    const key = r.program?._id || "general";
    const title = r.program?.title || "General";
    if (!byProgram[key]) byProgram[key] = { title, items: [] };
    byProgram[key].items.push(r);
  });

  return (
    <div style={{ marginBottom:"4px" }}>
      <div className="card" style={{ border:"1px solid rgba(245,158,11,0.35)", background:"rgba(245,158,11,0.03)" }}>
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontWeight:700, fontSize:"17px", color:"var(--gold)" }}>⭐ Trainer Recommended</div>
          <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>Hand-picked by your trainer specifically for your program</div>
        </div>

        {Object.entries(byProgram).map(([key, group]) => (
          <div key={key} style={{ marginBottom:"14px" }}>
            {Object.keys(byProgram).length > 1 && (
              <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"8px" }}>
                📋 {group.title}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {group.items.map(rec => (
                <div key={rec._id} style={{ display:"flex", gap:"14px", alignItems:"center", padding:"12px 14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
                  <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,var(--bg2),var(--surface2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                    {CAT_ICON[rec.product?.category]||"📦"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:"14px" }}>{rec.product?.name}</div>
                    {rec.note && (
                      <div style={{ fontSize:"12px", color:"var(--accent2)", marginTop:"2px", fontStyle:"italic" }}>
                        💬 "{rec.note}"
                      </div>
                    )}
                    <div style={{ display:"flex", gap:"8px", alignItems:"center", marginTop:"4px" }}>
                      <span style={{ fontSize:"11px", color:"var(--text3)" }}>{rec.product?.vendor?.businessName}</span>
                      {rec.product?.totalSold > 0 && <span style={{ fontSize:"10px", color:"var(--text3)" }}>· 🛒 {rec.product.totalSold} bought</span>}
                      {rec.product?.avgRating > 0 && (
                        <span style={{ fontSize:"10px", color:"var(--gold)" }}>· ★ {Number(rec.product.avgRating).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"var(--accent)", lineHeight:1 }}>₹{rec.product?.price}</div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop:"6px", fontSize:"11px" }}
                      onClick={() => rec.product && onBuy(rec.product, 1)}>
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── My Orders with Complete Payment + Cancel ──────────────────────────────────
function MyOrders({ token, user }) {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [retrying,   setRetrying]   = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // order object or null
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });

  const load = () => {
    api.get("/orders/mine", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  // ── Retry payment ──────────────────────────────────────────────────────────
  const retryPayment = async (order) => {
    setRetrying(order._id); setMsg({ type:"", text:"" });
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setMsg({ type:"error", text:"Payment gateway failed to load." }); setRetrying(null); return; }

      const { data } = await api.post(`/orders/${order._id}/retry`, {}, {
        headers: { Authorization:`Bearer ${token}` },
      });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency || "INR",
        name:        "FlexFit Marketplace",
        description: `Retry: ${order.items?.map(i=>i.name).join(", ")}`,
        order_id:    data.orderId,
        prefill:     { name: user?.name||"", email: user?.email||"" },
        theme:       { color:"#0070f3" },
        handler: async (response) => {
          try {
            await api.post("/orders/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderDbId:           data.orderDbId,
            }, { headers:{ Authorization:`Bearer ${token}` } });
            setMsg({ type:"success", text:`✅ Payment complete! ID: ${response.razorpay_payment_id}` });
            load();
          } catch {
            setMsg({ type:"error", text:"Payment done but verification failed. Contact support." });
          }
        },
        modal: { ondismiss: () => setRetrying(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { setMsg({ type:"error", text:"Payment failed. Try again." }); setRetrying(null); });
      rzp.open();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Could not retry payment." });
      setRetrying(null);
    }
  };

  // ── Cancel order ───────────────────────────────────────────────────────────
  const handleCancelConfirm = async (orderId, reason) => {
    setCancelling(true);
    try {
      await api.patch(
        `/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type:"success", text:"✅ Order cancelled successfully. Refund (if applicable) will be processed in 5–7 business days." });
      setCancelModal(null);
      load();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Could not cancel order. It may have already been shipped." });
      setCancelModal(null);
    } finally {
      setCancelling(false);
    }
  };

  // Orders that can be cancelled: pending or confirmed (not yet shipped/delivered/cancelled)
  const isCancellable = (order) => ["pending", "confirmed", "preparing"].includes(order.status);

  const STATUS_COLORS = { pending:"var(--gold)", confirmed:"var(--accent2)", preparing:"var(--accent)", shipped:"var(--accent3)", delivered:"var(--green)", cancelled:"var(--red)" };
  const STATUS_ICONS  = { pending:"⏳", confirmed:"✅", preparing:"👨‍🍳", shipped:"🚚", delivered:"📦", cancelled:"✕" };

  if (loading) return <div className="loading-screen" style={{minHeight:"120px"}}><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {msg.text && (
          <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>
            {msg.text}
            <button onClick={()=>setMsg({type:"",text:""})} style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit"}}>✕</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state" style={{padding:"32px"}}>
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No orders yet. Browse the marketplace to place your first order!</div>
          </div>
        ) : orders.map(o => (
          <div key={o._id} style={{
            background:"var(--bg3)", borderRadius:"var(--radius)",
            border:`1px solid ${
              o.status==="cancelled" ? "rgba(239,68,68,0.25)" :
              o.status==="pending"   ? "rgba(245,158,11,0.4)" :
              o.status==="delivered" ? "rgba(16,185,129,0.3)" :
              "var(--border)"
            }`,
            padding:"16px", overflow:"hidden",
          }}>
            {/* Order header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", marginBottom:"10px" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"5px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"11px", color:"var(--text3)", fontWeight:700 }}>#{String(o._id).slice(-8).toUpperCase()}</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:STATUS_COLORS[o.status] }}>
                    {STATUS_ICONS[o.status]} {o.status?.toUpperCase()}
                  </span>
                  <span style={{ fontSize:"11px", color:"var(--text3)" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </span>
                </div>
                <div style={{ fontWeight:600, fontSize:"14px", marginBottom:"4px" }}>
                  {o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}
                </div>
                {o.vendor?.businessName && (
                  <div style={{ fontSize:"12px", color:"var(--text3)" }}>📦 {o.vendor.businessName}</div>
                )}
                {o.deliveryAddress && (
                  <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"3px" }}>
                    📍 {o.deliveryAddress.length > 60 ? o.deliveryAddress.slice(0,60)+"…" : o.deliveryAddress}
                  </div>
                )}
                {/* Show cancellation reason if cancelled */}
                {o.status === "cancelled" && o.cancellationReason && (
                  <div style={{ fontSize:"11px", color:"var(--red)", marginTop:"4px", fontStyle:"italic" }}>
                    Reason: {o.cancellationReason}
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"var(--accent)", lineHeight:1 }}>₹{o.total}</div>
                {o.discount > 0 && <div style={{ fontSize:"11px", color:"var(--green)" }}>-₹{o.discount} saved</div>}
              </div>
            </div>

            {/* Status progress */}
            {o.status !== "cancelled" && (
              <div style={{ display:"flex", gap:"3px", marginBottom:"10px" }}>
                {["pending","confirmed","preparing","shipped","delivered"].map((s,i) => {
                  const steps = ["pending","confirmed","preparing","shipped","delivered"];
                  const done  = steps.indexOf(o.status) >= i;
                  return (
                    <div key={s} style={{ flex:1 }}>
                      <div style={{ height:"4px", borderRadius:"2px", background:done?STATUS_COLORS[o.status]:"var(--border)", transition:"background 0.3s" }}/>
                      <div style={{ fontSize:"8px", color: done?STATUS_COLORS[o.status]:"var(--text3)", textAlign:"center", marginTop:"3px", textTransform:"uppercase" }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPLETE PAYMENT button for pending unpaid orders */}
            {o.status === "pending" && !o.isPaid && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"13px", color:"var(--gold)" }}>⚠️ Payment Incomplete</div>
                    <div style={{ fontSize:"12px", color:"var(--text2)", marginTop:"2px" }}>Your order is reserved. Complete payment to confirm it.</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background:"var(--gold)", color:"#000", fontWeight:700, flexShrink:0 }}
                    onClick={() => retryPayment(o)}
                    disabled={retrying === o._id}
                  >
                    {retrying === o._id
                      ? <><span className="spinner" style={{borderTopColor:"#000",width:"12px",height:"12px"}}></span> Opening…</>
                      : "💳 Complete Payment"}
                  </button>
                </div>
              </div>
            )}

            {/* CANCEL ORDER button — only for pending/confirmed/preparing */}
            {isCancellable(o) && (
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button
                  className="btn btn-sm btn-outline"
                  style={{
                    color:"var(--red)",
                    borderColor:"rgba(239,68,68,0.35)",
                    fontSize:"12px",
                    padding:"6px 14px",
                  }}
                  onClick={() => { setMsg({ type:"", text:"" }); setCancelModal(o); }}
                >
                  🚫 Cancel Order
                </button>
              </div>
            )}

            {o.status === "delivered" && (
              <div style={{ fontSize:"12px", color:"var(--green)", fontWeight:700, textAlign:"center" }}>
                ✓ Order Delivered Successfully
              </div>
            )}

            {o.status === "cancelled" && (
              <div style={{ fontSize:"12px", color:"var(--red)", fontWeight:700, textAlign:"center" }}>
                ✕ Order Cancelled
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cancel Modal — rendered outside the list to avoid z-index issues */}
      {cancelModal && (
        <CancelOrderModal
          order={cancelModal}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelModal(null)}
          cancelling={cancelling}
        />
      )}
    </>
  );
}

// ── Main Marketplace ──────────────────────────────────────────────────────────
export default function Marketplace() {
  const { token, user }         = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch]     = useState("");
  const [activeTab, setActiveTab] = useState("shop");
  const [orderModal, setOrderModal] = useState(null);
  const [placing, setPlacing]   = useState(false);
  const [msg, setMsg]           = useState({ type:"", text:"" });
  const [userRatings, setUserRatings] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search)   params.search   = search;
      const res = await api.get("/marketplace/products", { params });
      setProducts(res.data.products || []);
    } catch { setMsg({ type:"error", text:"Failed to load products." }); }
    finally { setLoading(false); }
  }, [category, search]);

  useEffect(() => { load(); }, [category]);

  const handleBuy = (product, qty) => {
    setMsg({ type:"", text:"" });
    setOrderModal({ product, qty });
  };

  const handleRate = async (productId, rating) => {
    if (!token) return;
    try {
      await api.post(`/marketplace/products/${productId}/rate`, { rating }, {
        headers: { Authorization:`Bearer ${token}` },
      });
      setUserRatings(prev => ({ ...prev, [productId]: rating }));
      // Update product in list
      setProducts(prev => prev.map(p => {
        if (String(p._id) !== String(productId)) return p;
        const total = p.avgRating * p.totalRatings + rating;
        const newTotal = p.totalRatings + 1;
        return { ...p, avgRating: total/newTotal, totalRatings: newTotal };
      }));
    } catch {}
  };

  const handleConfirmOrder = async ({ address, phone }) => {
    if (!orderModal) return;
    const { product, qty } = orderModal;
    setPlacing(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setMsg({ type:"error", text:"Payment gateway failed." }); setPlacing(false); return; }

      const { data } = await api.post("/orders", {
        items: [{ productId: product._id, quantity: qty }],
        deliveryAddress: address, deliveryPhone: phone,
      }, { headers:{ Authorization:`Bearer ${token}` } });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency || "INR",
        name:        "FlexFit Marketplace",
        description: `${product.name} × ${qty}`,
        order_id:    data.orderId,
        prefill:     { name:user?.name||"", email:user?.email||"" },
        theme:       { color:"#0070f3" },
        handler: async (response) => {
          try {
            await api.post("/orders/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderDbId:           data.orderDbId,
            }, { headers:{ Authorization:`Bearer ${token}` } });
            setMsg({ type:"success", text:`✅ Order placed! Payment ID: ${response.razorpay_payment_id}` });
            setOrderModal(null);
            setTimeout(() => setActiveTab("orders"), 1200);
          } catch { setMsg({ type:"error", text:"Verification failed. Contact support." }); }
        },
        modal: { ondismiss: () => { setPlacing(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { setMsg({ type:"error", text:"Payment failed." }); setPlacing(false); });
      rzp.open();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Order failed." });
      setPlacing(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg3)", borderRadius:"12px", padding:"4px", width:"fit-content" }}>
        {[{id:"shop",label:"Shop",icon:"🛍️"},{id:"orders",label:"My Orders",icon:"📦"}].map(t => (
          <button key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding:"8px 20px",
              borderRadius:"9px",
              border:"none",
              cursor:"pointer",
              fontSize:"13px",
              fontWeight:600,
              transition:"all 0.2s",
              background: activeTab===t.id ? "var(--surface)" : "transparent",
              color: activeTab===t.id ? "var(--text)" : "var(--text3)",
              boxShadow: activeTab===t.id ? "0 1px 4px rgba(0,0,0,0.25)" : "none",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`} style={{ position:"sticky", top:"80px", zIndex:10 }}>
          {msg.text}
          <button onClick={()=>setMsg({type:"",text:""})} style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit",fontSize:"16px"}}>✕</button>
        </div>
      )}

      {activeTab === "orders" ? (
        <div className="card" style={{ borderRadius:"16px" }}>
          <h3 className="font-heading" style={{ fontSize:"22px", marginBottom:"20px", fontWeight:800, letterSpacing:"-0.3px" }}>My Orders</h3>
          <MyOrders token={token} user={user} />
        </div>
      ) : (
        <>
          {user?.role === "client" && <TrainerRecommendedSection token={token} onBuy={handleBuy} />}

          <div style={{
            background:"var(--surface)",
            border:"1px solid var(--border)",
            borderRadius:"var(--radius-lg)",
            padding:"14px 18px",
            display:"flex",
            gap:"12px",
            flexWrap:"wrap",
            alignItems:"center",
          }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", fontSize:"14px", opacity:0.4, pointerEvents:"none" }}>🔍</span>
              <input
                className="form-input"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key==="Enter" && load()}
                style={{ paddingLeft:"34px", maxWidth:"200px", borderRadius:"10px" }}
              />
            </div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", flex:1 }}>
              {CATEGORIES.map(c => (
                <button key={c.value}
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding:"7px 14px",
                    borderRadius:"8px",
                    border:`1px solid ${category===c.value ? "var(--accent)" : "var(--border)"}`,
                    background: category===c.value ? "var(--accent)" : "transparent",
                    color: category===c.value ? "#fff" : "var(--text2)",
                    fontSize:"12px",
                    fontWeight:600,
                    cursor:"pointer",
                    transition:"all 0.15s",
                    whiteSpace:"nowrap",
                  }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              style={{
                padding:"7px 12px",
                borderRadius:"8px",
                border:"1px solid var(--border)",
                background:"transparent",
                color:"var(--text3)",
                cursor:"pointer",
                fontSize:"16px",
                transition:"all 0.15s",
                marginLeft:"auto",
              }}
              title="Refresh">↻</button>
          </div>

          {loading ? (
            <div className="loading-screen" style={{minHeight:"260px"}}>
              <div className="spinner"></div><span>Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛍️</div>
              <div className="empty-state-text">No products found.</div>
            </div>
          ) : (
            <div className="grid-3">
              {products.map(p=>(
                <ProductCard key={p._id} product={p}
                  onBuy={handleBuy}
                  onRate={user ? handleRate : null}
                  userRatings={userRatings}
                />
              ))}
            </div>
          )}
        </>
      )}

      {orderModal && (
        <OrderModal
          product={orderModal.product} qty={orderModal.qty}
          onConfirm={handleConfirmOrder}
          onClose={()=>{setOrderModal(null);setPlacing(false);}}
          placing={placing}
        />
      )}
    </div>
  );
}