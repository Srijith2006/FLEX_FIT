import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORIES = [
  { value: "",           label: "All"         },
  { value: "supplement", label: "Supplements" },
  { value: "meal",       label: "Meals"       },
  { value: "equipment",  label: "Equipment"   },
  { value: "apparel",    label: "Apparel"     },
];

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function ProductCard({ product, onBuy, buying }) {
  const [pricing, setPricing] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/marketplace/products/${product._id}/pricing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPricing(res.data);
      } catch {}
    })();
  }, [product._id]);

  const discount = pricing?.totalDiscountPct || 0;
  const finalPrice = pricing?.finalPrice ?? product.price;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s",
      display: "flex", flexDirection: "column",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {/* Image placeholder */}
      <div style={{
        height: "140px", background: "linear-gradient(135deg,var(--bg2),var(--surface2))",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px",
      }}>
        {product.category === "supplement" ? "💊" :
         product.category === "meal"       ? "🥗" :
         product.category === "equipment"  ? "🏋️" : "👕"}
      </div>

      <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "3px" }}>{product.name}</div>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>{product.vendor?.businessName} · {product.vendor?.city}</div>
        </div>

        {product.description && (
          <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: "1.5" }}>
            {product.description.slice(0, 80)}{product.description.length > 80 ? "…" : ""}
          </div>
        )}

        {/* Macros */}
        {(product.calories > 0 || product.protein > 0) && (
          <div style={{ display: "flex", gap: "10px" }}>
            {product.calories > 0 && <span style={{ fontSize: "11px", color: "var(--text3)" }}>🔥 {product.calories} kcal</span>}
            {product.protein  > 0 && <span style={{ fontSize: "11px", color: "var(--text3)" }}>💪 {product.protein}g protein</span>}
          </div>
        )}

        {/* Discount badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {pricing?.tierLabel && (
            <span style={{ fontSize: "10px", fontWeight: 700,
              background: "rgba(245,158,11,0.15)", color: "var(--gold)",
              border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", padding: "2px 7px" }}>
              {pricing.tierLabel}
            </span>
          )}
          {pricing?.groupActive && (
            <span style={{ fontSize: "10px", fontWeight: 700,
              background: "rgba(0,229,255,0.08)", color: "var(--accent)",
              border: "1px solid rgba(0,229,255,0.2)", borderRadius: "6px", padding: "2px 7px" }}>
              👥 Group Buy -{pricing.groupDiscount}%
            </span>
          )}
          {pricing?.groupBuyersNeeded > 0 && (
            <span style={{ fontSize: "10px", color: "var(--text3)", alignSelf: "center" }}>
              {pricing.groupBuyersNeeded} more for group deal
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px",
              color: discount > 0 ? "var(--green)" : "var(--accent)", lineHeight: 1 }}>
              ₹{finalPrice}
            </div>
            {discount > 0 && (
              <div style={{ fontSize: "11px", color: "var(--text3)", textDecoration: "line-through" }}>
                ₹{product.price}
              </div>
            )}
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onBuy(product, pricing)}
            disabled={buying === product._id}
          >
            {buying === product._id ? "…" : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState([]); // { product, pricing }
  const [showCart, setShowCart] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const params = {};
        if (category) params.category = category;
        const res = await api.get("/marketplace/products", { params });
        setProducts(res.data.products || []);
      } catch { setMsg({ type: "error", text: "Failed to load products." }); }
      finally { setLoading(false); }
    })();
  }, [category]);

  const addToCart = (product, pricing) => {
    setCart(prev => {
      const exists = prev.find(c => c.product._id === product._id);
      if (exists) return prev.map(c => c.product._id === product._id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, pricing, qty: 1 }];
    });
    setShowCart(true);
  };

  const checkout = async () => {
    if (!address.trim()) { setMsg({ type: "error", text: "Please enter delivery address." }); return; }
    if (cart.length === 0) return;

    const loaded = await loadRazorpay();
    if (!loaded) { setMsg({ type: "error", text: "Failed to load payment gateway." }); return; }

    try {
      // All items must be same vendor — use first
      const items = cart.map(c => ({ productId: c.product._id, quantity: c.qty }));
      const { data } = await api.post("/orders", { items, deliveryAddress: address, deliveryPhone: phone },
        { headers: { Authorization: `Bearer ${token}` } });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "FlexFit Marketplace",
        order_id: data.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#0070f3" },
        handler: async (response) => {
          try {
            await api.post("/orders/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderDbId:           data.orderDbId,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg({ type: "success", text: `🎉 Order placed! Payment ID: ${response.razorpay_payment_id}` });
            setCart([]);
            setShowCart(false);
          } catch { setMsg({ type: "error", text: "Payment verification failed." }); }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setMsg({ type: "error", text: "Payment failed." }));
      rzp.open();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Checkout failed." });
    }
  };

  const cartTotal = cart.reduce((s, c) => s + (c.pricing?.finalPrice ?? c.product.price) * c.qty, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c.value}
                className={`btn btn-sm ${category === c.value ? "btn-primary" : "btn-outline"}`}
                onClick={() => setCategory(c.value)}>{c.label}</button>
            ))}
          </div>
          {cart.length > 0 && (
            <button className="btn btn-accent btn-sm" onClick={() => setShowCart(s => !s)}>
              🛒 Cart ({cart.length}) · ₹{cartTotal}
            </button>
          )}
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`}>{msg.text}</div>}

      {/* Cart */}
      {showCart && cart.length > 0 && (
        <div className="card">
          <h4 className="font-heading" style={{ fontSize: "18px", marginBottom: "14px" }}>Your Cart</h4>
          {cart.map(c => (
            <div key={c.product._id} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{c.product.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text3)" }}>Qty: {c.qty}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>₹{(c.pricing?.finalPrice ?? c.product.price) * c.qty}</span>
                <button className="btn btn-danger btn-sm" style={{ padding: "2px 8px" }}
                  onClick={() => setCart(prev => prev.filter(x => x.product._id !== c.product._id))}>✕</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <textarea className="form-textarea" rows="2" placeholder="Full delivery address…"
                value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+91 9876543210"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontWeight: 700, fontSize: "16px", padding: "10px 0" }}>
              <span>Total</span><span style={{ color: "var(--green)" }}>₹{cartTotal}</span>
            </div>
            <button className="btn btn-accent btn-full" onClick={checkout}>
              Pay ₹{cartTotal} with Razorpay
            </button>
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛍️</div>
          <div className="empty-state-text">No products available yet. Check back soon!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "16px" }}>
          {products.map(p => (
            <ProductCard key={p._id} product={p} onBuy={addToCart} buying={buying} />
          ))}
        </div>
      )}
    </div>
  );
}