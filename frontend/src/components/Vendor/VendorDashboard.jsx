import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const STATUS_PIPELINE = ["pending","confirmed","preparing","shipped","delivered"];
const STATUS_COLORS = {
  pending:   "#f59e0b",
  confirmed: "#0070f3",
  preparing: "#8b5cf6",
  shipped:   "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};
const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };
const EMPTY_PRODUCT  = {
  name:"", description:"", category:"supplement", imageUrl:"",
  price:"", originalPrice:"", unit:"unit", stock:"",
  calories:"", protein:"", carbs:"", fat:"",
  groupBuyEnabled:false, groupBuyThreshold:"10", groupBuyDiscount:"15",
};

// ── SVG icon set ──────────────────────────────────────────────────────────────
const Ic = {
  revenue: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  box:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  check:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  trend:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  refresh:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  warning:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  upload:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  ok:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const card = {
  background:"var(--bg2)",
  border:"1px solid rgba(255,255,255,0.06)",
  borderRadius:"12px",
};

function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
      <span style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)",
        textTransform:"uppercase", letterSpacing:"1.2px" }}>
        {title}
      </span>
      {action && (
        <button onClick={onAction} style={{ display:"flex", alignItems:"center", gap:"3px",
          fontSize:"11px", fontWeight:600, color:"var(--accent)",
          background:"none", border:"none", cursor:"pointer" }}>
          {action} {Ic.chevron}
        </button>
      )}
    </div>
  );
}

function HR() {
  return <div style={{ height:"1px", background:"rgba(255,255,255,0.05)" }} />;
}

function Alert({ text, type, onClose }) {
  if (!text) return null;
  const isErr = type === "error";
  return (
    <div style={{ padding:"10px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:600,
      display:"flex", justifyContent:"space-between", alignItems:"center",
      background: isErr ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
      color:       isErr ? "var(--red)"           : "var(--green)",
      border:`1px solid ${isErr ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
      {text}
      {onClose && (
        <button onClick={onClose} style={{ background:"none", border:"none",
          cursor:"pointer", color:"inherit", marginLeft:"10px", fontSize:"14px" }}>✕</button>
      )}
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const next = STATUS_PIPELINE[STATUS_PIPELINE.indexOf(order.status) + 1];
  const isCancelled = order.status === "cancelled";

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try { await onStatusUpdate(order._id, next); }
    finally { setUpdating(false); }
  };

  return (
    <div style={{ ...card, padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ fontWeight:600, fontSize:"13px" }}>{order.client?.user?.name || "Client"}</div>
          <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
            {order.client?.user?.email} · {new Date(order.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"var(--green)", lineHeight:1 }}>
            ₹{order.total}
          </div>
          <span style={{ display:"inline-block", marginTop:"3px", padding:"2px 7px", borderRadius:"4px",
            fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px",
            background:`${STATUS_COLORS[order.status]||"#666"}18`,
            color:STATUS_COLORS[order.status]||"var(--text3)" }}>
            {order.status}
          </span>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"3px", marginBottom:"10px" }}>
        {order.items.map((item,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"var(--text2)" }}>
            <span>{item.name} × {item.quantity}</span>
            <span style={{ color:"var(--text3)" }}>₹{item.totalPrice}</span>
          </div>
        ))}
      </div>

      {order.deliveryAddress && (
        <div style={{ fontSize:"11px", color:"var(--text3)", marginBottom:"10px",
          padding:"6px 10px", background:"rgba(255,255,255,0.02)",
          borderRadius:"6px", border:"1px solid rgba(255,255,255,0.04)" }}>
          {order.deliveryAddress}{order.deliveryPhone && ` · ${order.deliveryPhone}`}
        </div>
      )}

      {!isCancelled && (
        <div style={{ display:"flex", gap:"3px", marginBottom:"10px" }}>
          {STATUS_PIPELINE.map((s, i) => {
            const done = STATUS_PIPELINE.indexOf(order.status) >= i;
            return (
              <div key={s} style={{ flex:1 }}>
                <div style={{ height:"3px", borderRadius:"2px",
                  background: done ? STATUS_COLORS[order.status] : "rgba(255,255,255,0.07)",
                  transition:"background 0.3s" }} />
                <div style={{ fontSize:"8px", color: done ? STATUS_COLORS[order.status] : "var(--text3)",
                  textAlign:"center", marginTop:"3px", textTransform:"uppercase",
                  letterSpacing:"0.3px", opacity: done ? 1 : 0.4 }}>
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {next && !isCancelled && (
        <button onClick={advance} disabled={updating}
          style={{ width:"100%", padding:"8px", borderRadius:"7px", fontSize:"12px",
            fontWeight:600, cursor:"pointer",
            border:"1px solid rgba(0,112,243,0.22)",
            background:"rgba(0,112,243,0.07)", color:"var(--accent)",
            transition:"opacity 0.15s", opacity:updating?0.5:1 }}>
          {updating ? "Updating…" : `Mark as ${next.charAt(0).toUpperCase()+next.slice(1)} →`}
        </button>
      )}

      {order.status === "delivered" && (
        <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 12px",
          background:"rgba(16,185,129,0.07)", borderRadius:"7px",
          border:"1px solid rgba(16,185,129,0.14)", fontSize:"12px",
          color:"var(--green)", fontWeight:600 }}>
          <span style={{ display:"flex" }}>{Ic.ok}</span> Delivered
        </div>
      )}

      {isCancelled && (
        <div style={{ padding:"10px 12px", background:"rgba(239,68,68,0.06)",
          borderRadius:"7px", border:"1px solid rgba(239,68,68,0.14)" }}>
          <div style={{ fontSize:"12px", fontWeight:600, color:"var(--red)",
            marginBottom: order.cancellationReason ? "4px" : 0 }}>
            Cancelled by client
          </div>
          {order.cancellationReason && (
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>Reason: {order.cancellationReason}</div>
          )}
          {order.cancelledAt && (
            <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"3px" }}>
              {new Date(order.cancelledAt).toLocaleDateString("en-IN",
                {day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ vendor, orders, products, onTabChange }) {
  const delivered  = orders.filter(o => o.status==="delivered");
  const active     = orders.filter(o => ["pending","confirmed","preparing","shipped"].includes(o.status));
  const cancelled  = orders.filter(o => o.status==="cancelled");
  const revenue    = vendor.totalRevenue || 0;
  const avgOrder   = delivered.length > 0 ? Math.round(delivered.reduce((s,o)=>s+o.total,0)/delivered.length) : 0;
  const topProds   = [...products].sort((a,b)=>(b.totalSold||0)-(a.totalSold||0)).slice(0,3);
  const recent     = [...orders].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
  const lowStock   = products.filter(p=>p.stock<=10&&p.stock>0);
  const outOfStock = products.filter(p=>p.stock===0);

  const kpis = [
    { label:"Total Revenue",   value:`₹${revenue.toLocaleString()}`, color:"var(--gold)",    icon:Ic.revenue },
    { label:"Active Orders",   value:active.length,                  color:"var(--accent)",  icon:Ic.box     },
    { label:"Delivered",       value:delivered.length,               color:"var(--green)",   icon:Ic.check   },
    { label:"Avg Order Value", value:`₹${avgOrder}`,                 color:"var(--accent2)", icon:Ic.trend   },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...card, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
              <div style={{ color:k.color, display:"flex", opacity:0.8 }}>{k.icon}</div>
              <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text3)",
                textTransform:"uppercase", letterSpacing:"0.8px" }}>
                {k.label}
              </span>
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
              color:k.color, lineHeight:1 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent + Top Products */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div style={{ ...card, padding:"16px 18px" }}>
          <SectionHead title="Recent Orders" action="View all" onAction={() => onTabChange("orders")} />
          {recent.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:"12px", textAlign:"center", padding:"20px 0" }}>No orders yet</div>
          ) : recent.map((o,i) => (
            <div key={o._id}>
              {i>0 && <HR />}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0" }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:"12px", fontWeight:600, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {o.items?.map(i=>i.name).join(", ").slice(0,26)}
                    {o.items?.map(i=>i.name).join(", ").length > 26 ? "…" : ""}
                  </div>
                  <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"2px" }}>
                    {o.client?.user?.name} · {new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:"12px" }}>
                  <div style={{ fontWeight:700, color:"var(--green)", fontSize:"13px" }}>₹{o.total}</div>
                  <div style={{ fontSize:"10px", fontWeight:700, textTransform:"uppercase",
                    color:STATUS_COLORS[o.status], marginTop:"2px" }}>
                    {o.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding:"16px 18px" }}>
          <SectionHead title="Top Products" action="Manage" onAction={() => onTabChange("products")} />
          {topProds.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:"12px", textAlign:"center", padding:"20px 0" }}>No products yet</div>
          ) : topProds.map((p,i) => (
            <div key={p._id}>
              {i>0 && <HR />}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 0" }}>
                <div style={{ width:"32px", height:"32px", borderRadius:"7px", overflow:"hidden",
                  flexShrink:0, background:"rgba(255,255,255,0.04)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : CATEGORY_ICONS[p.category]||"📦"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"12px", fontWeight:600, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ fontSize:"10px", color:"var(--text3)" }}>₹{p.price} · {p.totalSold||0} sold</div>
                </div>
                <div style={{ fontSize:"11px", fontWeight:700, color:"var(--gold)", flexShrink:0 }}>#{i+1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory + Breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div style={{ ...card, padding:"16px 18px" }}>
          <SectionHead title="Inventory Alerts" />
          {outOfStock.length===0 && lowStock.length===0 ? (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 12px",
              background:"rgba(16,185,129,0.06)", borderRadius:"8px",
              border:"1px solid rgba(16,185,129,0.12)", fontSize:"12px",
              color:"var(--green)", fontWeight:600 }}>
              <span style={{ display:"flex" }}>{Ic.ok}</span> All products well stocked
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {outOfStock.map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"8px 10px",
                  background:"rgba(239,68,68,0.06)", borderRadius:"7px",
                  border:"1px solid rgba(239,68,68,0.14)" }}>
                  <span style={{ fontSize:"12px", fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"var(--red)",
                    textTransform:"uppercase", letterSpacing:"0.4px" }}>Out of stock</span>
                </div>
              ))}
              {lowStock.map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"8px 10px",
                  background:"rgba(245,158,11,0.06)", borderRadius:"7px",
                  border:"1px solid rgba(245,158,11,0.14)" }}>
                  <span style={{ fontSize:"12px", fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"var(--gold)" }}>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...card, padding:"16px 18px" }}>
          <SectionHead title="Order Breakdown" />
          {orders.length===0 ? (
            <div style={{ color:"var(--text3)", fontSize:"12px", textAlign:"center", padding:"20px 0" }}>No orders yet</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                { label:"Delivered", count:delivered.length, color:"#10b981", pct:Math.round(delivered.length/orders.length*100) },
                { label:"Active",    count:active.length,    color:"#0070f3", pct:Math.round(active.length/orders.length*100) },
                { label:"Cancelled", count:cancelled.length, color:"#ef4444", pct:Math.round(cancelled.length/orders.length*100) },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", marginBottom:"5px" }}>
                    <span style={{ color:"var(--text3)", fontWeight:600 }}>{row.label}</span>
                    <span style={{ color:row.color, fontWeight:700 }}>
                      {row.count} <span style={{ color:"var(--text3)", fontWeight:400 }}>({row.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height:"4px", background:"rgba(255,255,255,0.06)", borderRadius:"2px" }}>
                    <div style={{ height:"100%", width:`${row.pct}%`, background:row.color,
                      borderRadius:"2px", transition:"width 0.6s ease" }} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop:"8px", borderTop:"1px solid rgba(255,255,255,0.05)",
                display:"flex", justifyContent:"space-between", fontSize:"11px" }}>
                <span style={{ color:"var(--text3)" }}>Total orders</span>
                <span style={{ fontWeight:700 }}>{orders.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        <button onClick={() => onTabChange("products")}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px",
            borderRadius:"8px", fontSize:"12px", fontWeight:600,
            cursor:"pointer", border:"none", background:"var(--accent)", color:"#fff" }}>
          {Ic.plus} Add Product
        </button>
        <button onClick={() => onTabChange("orders")}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px",
            borderRadius:"8px", fontSize:"12px", fontWeight:600, cursor:"pointer",
            background:"rgba(255,255,255,0.04)", color:"var(--text2)",
            border:"1px solid rgba(255,255,255,0.08)" }}>
          View All Orders
        </button>
      </div>
    </div>
  );
}

// ── Product Form Modal ─────────────────────────────────────────────────────────
function ProductFormModal({ initial, onSave, onClose, saving }) {
  const [form,  setForm]  = useState(initial || EMPTY_PRODUCT);
  const [imgOk, setImgOk] = useState(!!initial?.imageUrl);
  const [imgErr,setImgErr]= useState(false);
  const h = f => e => setForm(p=>({...p,[f]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const lbl = { fontSize:"10px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
    letterSpacing:"0.7px", marginBottom:"5px", display:"block" };
  const inp = { width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:"7px", padding:"9px 12px", color:"var(--text)", fontSize:"13px",
    outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", overflowY:"auto" }}>
      <div style={{ background:"var(--bg2)", border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:"14px", padding:"26px", width:"100%", maxWidth:"580px",
        maxHeight:"90vh", overflowY:"auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <h3 style={{ fontWeight:700, fontSize:"15px", margin:0 }}>
            {initial?._id ? "Edit Product" : "New Product"}
          </h3>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", color:"var(--text3)", fontSize:"18px", lineHeight:1 }}>✕</button>
        </div>

        {/* Image */}
        <div style={{ marginBottom:"16px" }}>
          <label style={lbl}>Product Image URL</label>
          <div style={{ marginBottom:"8px", borderRadius:"8px", overflow:"hidden", height:"140px",
            background:"rgba(255,255,255,0.02)",
            border:`1px dashed ${imgOk?"var(--accent)":"rgba(255,255,255,0.1)"}`,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            {form.imageUrl && !imgErr ? (
              <img src={form.imageUrl} alt="preview" referrerPolicy="no-referrer"
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                onLoad={()=>{setImgOk(true);setImgErr(false);}}
                onError={()=>{setImgOk(false);setImgErr(true);}} />
            ) : (
              <div style={{ textAlign:"center", color:"var(--text3)", padding:"12px" }}>
                <div style={{ fontSize:"24px", opacity:0.4, marginBottom:"4px" }}>
                  {CATEGORY_ICONS[form.category]||"📦"}
                </div>
                <div style={{ fontSize:"11px" }}>
                  {imgErr ? "Cannot preview — URL saved" : "Paste a URL below to preview"}
                </div>
              </div>
            )}
            {imgOk && (
              <div style={{ position:"absolute", top:"6px", right:"6px",
                background:"rgba(16,185,129,0.9)", borderRadius:"4px",
                padding:"2px 7px", fontSize:"10px", fontWeight:700, color:"#fff" }}>
                ✓ Loaded
              </div>
            )}
          </div>
          <input style={inp} placeholder="https://i.imgur.com/example.jpg"
            value={form.imageUrl}
            onChange={e=>{setForm(p=>({...p,imageUrl:e.target.value}));setImgOk(false);setImgErr(false);}} />
          <div style={{ marginTop:"4px", fontSize:"10px", color:"var(--text3)" }}>
            Tip: right-click any image → Copy image address → paste above
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Product Name *</label>
            <input style={inp} placeholder="e.g. Whey Protein Gold" value={form.name} onChange={h("name")} />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select style={inp} value={form.category} onChange={h("category")}>
              <option value="supplement">Supplement</option>
              <option value="meal">Meal</option>
              <option value="equipment">Equipment</option>
              <option value="apparel">Apparel</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Unit</label>
            <select style={inp} value={form.unit} onChange={h("unit")}>
              <option value="unit">Unit</option>
              <option value="kg">kg</option>
              <option value="bottle">Bottle</option>
              <option value="pack">Pack</option>
              <option value="serving">Serving</option>
              <option value="piece">Piece</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:"12px" }}>
          <label style={lbl}>Description</label>
          <textarea style={{...inp,resize:"vertical"}} rows={2}
            placeholder="Benefits, ingredients, etc."
            value={form.description} onChange={h("description")} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"12px" }}>
          <div><label style={lbl}>Price (₹) *</label><input style={inp} type="number" min="0" placeholder="999" value={form.price} onChange={h("price")} /></div>
          <div><label style={lbl}>Original (₹)</label><input style={inp} type="number" min="0" placeholder="1299" value={form.originalPrice} onChange={h("originalPrice")} /></div>
          <div><label style={lbl}>Stock</label><input style={inp} type="number" min="0" placeholder="100" value={form.stock} onChange={h("stock")} /></div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"9px", padding:"12px", marginBottom:"12px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.7px", marginBottom:"10px" }}>Nutrition (optional)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px" }}>
            {[["calories","Calories"],["protein","Protein g"],["carbs","Carbs g"],["fat","Fat g"]].map(([f,l]) => (
              <div key={f}><label style={lbl}>{l}</label>
                <input style={inp} type="number" min="0" placeholder="0" value={form[f]} onChange={h(f)} /></div>
            ))}
          </div>
        </div>

        <div style={{ background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.14)",
          borderRadius:"9px", padding:"12px", marginBottom:"18px" }}>
          <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer",
            marginBottom:form.groupBuyEnabled?"10px":0 }}>
            <input type="checkbox" checked={form.groupBuyEnabled} onChange={h("groupBuyEnabled")}
              style={{ width:"14px", height:"14px", accentColor:"var(--green)" }} />
            <span style={{ fontSize:"12px", fontWeight:600, color:"var(--green)" }}>Enable Group Buy Deal</span>
          </label>
          {form.groupBuyEnabled && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div><label style={lbl}>Min. Buyers</label>
                <input style={inp} type="number" min="2" placeholder="10" value={form.groupBuyThreshold} onChange={h("groupBuyThreshold")} /></div>
              <div><label style={lbl}>Discount %</label>
                <input style={inp} type="number" min="1" max="90" placeholder="15" value={form.groupBuyDiscount} onChange={h("groupBuyDiscount")} /></div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:"8px" }}>
          <button disabled={saving||!form.name||!form.price} onClick={()=>onSave(form)}
            style={{ flex:1, padding:"10px", borderRadius:"8px", fontSize:"13px", fontWeight:600,
              cursor:"pointer", border:"none", background:"var(--accent)", color:"#fff",
              opacity:(saving||!form.name||!form.price)?0.5:1 }}>
            {saving?"Saving…":initial?._id?"Update Product":"Add Product"}
          </button>
          <button onClick={onClose} disabled={saving}
            style={{ padding:"10px 18px", borderRadius:"8px", fontSize:"13px", fontWeight:500,
              cursor:"pointer", background:"rgba(255,255,255,0.03)", color:"var(--text2)",
              border:"1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Products Tab ───────────────────────────────────────────────────────────────
function ProductsTab({ products, isApproved, token, onRefresh }) {
  const [showForm,setShowForm]=useState(false);
  const [editing, setEditing] =useState(null);
  const [saving,  setSaving]  =useState(false);
  const [deleting,setDeleting]=useState(null);
  const [msg, setMsg]         =useState({type:"",text:""});

  const saveProduct = async (form) => {
    setSaving(true); setMsg({type:"",text:""});
    try {
      const payload = {
        name:form.name, description:form.description, category:form.category,
        imageUrl:form.imageUrl, price:Number(form.price),
        originalPrice:Number(form.originalPrice)||0, unit:form.unit,
        stock:Number(form.stock)||0, calories:Number(form.calories)||0,
        protein:Number(form.protein)||0, carbs:Number(form.carbs)||0,
        fat:Number(form.fat)||0, groupBuyEnabled:form.groupBuyEnabled,
        groupBuyThreshold:Number(form.groupBuyThreshold)||10,
        groupBuyDiscount:Number(form.groupBuyDiscount)||15,
      };
      if (editing?._id) {
        await api.put(`/vendors/products/${editing._id}`, payload, {headers:{Authorization:`Bearer ${token}`}});
        setMsg({type:"success",text:"Product updated."});
      } else {
        await api.post("/vendors/products", payload, {headers:{Authorization:`Bearer ${token}`}});
        setMsg({type:"success",text:"Product added to marketplace."});
      }
      setShowForm(false); setEditing(null); onRefresh();
    } catch(e) {
      setMsg({type:"error",text:e?.response?.data?.message||"Failed to save."});
    } finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/vendors/products/${id}`, {headers:{Authorization:`Bearer ${token}`}});
      setMsg({type:"success",text:"Product deleted."}); onRefresh();
    } catch { setMsg({type:"error",text:"Failed to delete."}); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ ...card, padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:"1.2px" }}>My Products</div>
          <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>
            {products.length} product{products.length!==1?"s":""}
          </div>
        </div>
        {isApproved && (
          <button onClick={()=>{setEditing(null);setShowForm(true);}}
            style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px",
              borderRadius:"8px", fontSize:"12px", fontWeight:600,
              cursor:"pointer", border:"none", background:"var(--accent)", color:"#fff" }}>
            {Ic.plus} Add Product
          </button>
        )}
      </div>

      {msg.text && (
        <div style={{ marginBottom:"12px" }}>
          <Alert text={msg.text} type={msg.type} onClose={()=>setMsg({type:"",text:""})} />
        </div>
      )}

      {!isApproved && (
        <div style={{ marginBottom:"14px", padding:"10px 12px", borderRadius:"8px", fontSize:"12px",
          background:"rgba(239,68,68,0.06)", color:"var(--text2)",
          border:"1px solid rgba(239,68,68,0.14)" }}>
          Product listing is locked until your account is approved by admin.
        </div>
      )}

      {products.length===0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:"6px", padding:"32px",
          color:"var(--text3)", fontSize:"12px", textAlign:"center" }}>
          <div style={{ fontSize:"22px", opacity:0.25 }}>📦</div>
          <div style={{ fontWeight:600, color:"var(--text2)" }}>
            {isApproved?"No products yet":"Approval required"}
          </div>
          <div>{isApproved?'Click "Add Product" to get started':"Get approved to start listing"}</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {products.map((p,i) => (
            <div key={p._id}>
              {i>0 && <HR />}
              <div style={{ display:"flex", gap:"12px", alignItems:"center", padding:"11px 0" }}>
                <div style={{ width:"42px", height:"42px", borderRadius:"8px", overflow:"hidden",
                  flexShrink:0, background:"rgba(255,255,255,0.04)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}
                        onError={e=>{e.target.style.display="none";}} />
                    : CATEGORY_ICONS[p.category]||"📦"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:"13px" }}>{p.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                    ₹{p.price}{p.originalPrice>p.price?` (was ₹${p.originalPrice})`:""} · {p.category} · {p.stock} in stock · {p.totalSold||0} sold
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px", alignItems:"center", flexShrink:0 }}>
                  <span style={{ padding:"2px 7px", borderRadius:"4px", fontSize:"10px",
                    fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px",
                    background:p.isAvailable?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",
                    color:p.isAvailable?"var(--green)":"var(--red)",
                    border:`1px solid ${p.isAvailable?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}` }}>
                    {p.isAvailable?"Live":"Off"}
                  </span>
                  <button onClick={()=>{setEditing(p);setShowForm(true);}}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center",
                      width:"28px", height:"28px", borderRadius:"6px", cursor:"pointer",
                      background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                      color:"var(--text3)", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.borderColor="rgba(0,112,243,0.3)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="var(--text3)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
                    {Ic.edit}
                  </button>
                  <button onClick={()=>deleteProduct(p._id)} disabled={deleting===p._id}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center",
                      width:"28px", height:"28px", borderRadius:"6px", cursor:"pointer",
                      background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.14)",
                      color:"rgba(239,68,68,0.55)", transition:"all 0.15s",
                      opacity:deleting===p._id?0.4:1 }}
                    onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";e.currentTarget.style.background="rgba(239,68,68,0.12)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="rgba(239,68,68,0.55)";e.currentTarget.style.background="rgba(239,68,68,0.06)";}}>
                    {deleting===p._id?"…":Ic.trash}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormModal initial={editing} onSave={saveProduct}
          onClose={()=>{setShowForm(false);setEditing(null);}}
          saving={saving} token={token} />
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const { token } = useAuth();
  const [vendor,  setVendor]  = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [products,setProducts]= useState([]);
  const [tab,     setTab]     = useState("overview");
  const [loading, setLoading] = useState(true);
  const [registering,setRegistering]=useState(false);
  const [uploading,  setUploading]  =useState(false);
  const [regForm,    setRegForm]    =useState({businessName:"",businessType:"supplements",description:"",city:""});
  const [msg,     setMsg]     = useState({type:"",text:""});
  const [lastRefreshed,setLastRefreshed]=useState(null);
  const [refreshing,   setRefreshing]  =useState(false);
  const pollRef = useRef(null);

  const refreshOrders = useCallback(async(silent=true)=>{
    if(!silent) setRefreshing(true);
    try {
      const res = await api.get("/orders/vendor",{headers:{Authorization:`Bearer ${token}`}});
      setOrders(res.data.orders||[]); setLastRefreshed(new Date());
    } catch {}
    finally { if(!silent) setRefreshing(false); }
  },[token]);

  const loadAll = useCallback(async()=>{
    try {
      const [vRes,oRes,pRes] = await Promise.allSettled([
        api.get("/vendors/me",           {headers:{Authorization:`Bearer ${token}`}}),
        api.get("/orders/vendor",        {headers:{Authorization:`Bearer ${token}`}}),
        api.get("/vendors/products/mine",{headers:{Authorization:`Bearer ${token}`}}),
      ]);
      if(vRes.status==="fulfilled") setVendor(vRes.value.data.vendor);
      if(oRes.status==="fulfilled"){ setOrders(oRes.value.data.orders||[]); setLastRefreshed(new Date()); }
      if(pRes.status==="fulfilled") setProducts(pRes.value.data.products||[]);
    } catch {} finally { setLoading(false); }
  },[token]);

  useEffect(()=>{
    loadAll();
    pollRef.current = setInterval(()=>refreshOrders(true),30_000);
    return ()=>clearInterval(pollRef.current);
  },[loadAll,refreshOrders]);

  const register = async()=>{
    if(!regForm.businessName){setMsg({type:"error",text:"Business name is required."});return;}
    setRegistering(true);
    try {
      const res=await api.post("/vendors/register",regForm,{headers:{Authorization:`Bearer ${token}`}});
      setVendor(res.data.vendor);
      setMsg({type:"success",text:"Profile created! Now upload your license certificate."});
    } catch(e){ setMsg({type:"error",text:e?.response?.data?.message||"Registration failed."}); }
    finally { setRegistering(false); }
  };

  const handleFileUpload = async(e)=>{
    const file=e.target.files[0]; if(!file) return;
    const fd=new FormData(); fd.append("certificate",file);
    setUploading(true); setMsg({type:"info",text:"Uploading…"});
    try {
      await api.put("/vendors/me/certificate",fd,{headers:{Authorization:`Bearer ${token}`}});
      const vRes=await api.get("/vendors/me",{headers:{Authorization:`Bearer ${token}`}});
      setVendor(vRes.data.vendor);
      setMsg({type:"success",text:"Certificate uploaded. Admin will review your account."});
    } catch { setMsg({type:"error",text:"Upload failed. Please try again."}); }
    finally { setUploading(false); }
  };

  const updateStatus = async(orderId,status)=>{
    await api.patch(`/orders/${orderId}/status`,{status},{headers:{Authorization:`Bearer ${token}`}});
    setOrders(prev=>prev.map(o=>o._id===orderId?{...o,status}:o));
  };

  if(loading) return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {[56,48,200].map((h,i)=>(
        <div key={i} style={{height:`${h}px`,borderRadius:"12px",
          background:"rgba(255,255,255,0.03)",animation:"pulse 1.8s ease infinite"}} />
      ))}
    </div>
  );

  // ── Registration ───────────────────────────────────────────────────────────
  if(!vendor){
    const inp={width:"100%",background:"rgba(255,255,255,0.03)",
      border:"1px solid rgba(255,255,255,0.08)",borderRadius:"7px",
      padding:"9px 12px",color:"var(--text)",fontSize:"13px",
      outline:"none",boxSizing:"border-box"};
    const lbl={fontSize:"10px",fontWeight:700,color:"var(--text3)",
      textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"5px",display:"block"};
    return(
      <div style={{maxWidth:"460px",margin:"0 auto",padding:"32px 0"}}>
        <div style={{marginBottom:"22px"}}>
          <h3 style={{fontWeight:700,fontSize:"20px",margin:"0 0 5px"}}>Set Up Vendor Profile</h3>
          <p style={{color:"var(--text3)",fontSize:"13px",margin:0}}>
            List your products on the FlexFit Marketplace.
          </p>
        </div>
        {msg.text && <div style={{marginBottom:"14px"}}><Alert text={msg.text} type={msg.type} /></div>}
        <div style={{display:"flex",flexDirection:"column",gap:"13px"}}>
          <div><label style={lbl}>Business Name *</label>
            <input style={inp} placeholder="e.g. ProNutrition Labs" value={regForm.businessName}
              onChange={e=>setRegForm(f=>({...f,businessName:e.target.value}))} /></div>
          <div><label style={lbl}>Business Type</label>
            <select style={inp} value={regForm.businessType}
              onChange={e=>setRegForm(f=>({...f,businessType:e.target.value}))}>
              <option value="supplements">Supplements</option>
              <option value="meal_kitchen">Meal Kitchen</option>
              <option value="equipment">Equipment</option>
              <option value="apparel">Apparel</option>
              <option value="other">Other</option>
            </select></div>
          <div><label style={lbl}>City</label>
            <input style={inp} placeholder="e.g. Mumbai" value={regForm.city}
              onChange={e=>setRegForm(f=>({...f,city:e.target.value}))} /></div>
          <div><label style={lbl}>Description</label>
            <textarea style={{...inp,resize:"vertical"}} rows={2} placeholder="What do you sell?"
              value={regForm.description}
              onChange={e=>setRegForm(f=>({...f,description:e.target.value}))} /></div>
          <button onClick={register} disabled={registering}
            style={{padding:"11px",borderRadius:"8px",fontSize:"13px",fontWeight:600,
              cursor:"pointer",border:"none",background:"var(--accent)",color:"#fff",
              opacity:registering?0.6:1}}>
            {registering?"Creating…":"Create Vendor Profile"}
          </button>
        </div>
      </div>
    );
  }

  const vcfgColors = {
    pending:"#f59e0b", approved:"#10b981", rejected:"#ef4444",
  };
  const vcfgLabels = {
    pending:"Pending Approval", approved:"Verified", rejected:"Rejected",
  };
  const vcfg      = { color: vcfgColors[vendor.verificationStatus]||"#666", label: vcfgLabels[vendor.verificationStatus]||"" };
  const isApproved= vendor.verificationStatus==="approved";
  const cancelled = orders.filter(o=>o.status==="cancelled");

  return (
    // ── Outer wrapper with side padding so nothing touches screen edges ──────
    <div style={{ maxWidth:"1200px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* Business header */}
      <div style={{ ...card, padding:"16px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"17px", marginBottom:"3px" }}>
            {vendor.businessName}
          </div>
          <div style={{ fontSize:"12px", color:"var(--text3)" }}>
            {vendor.businessType?.replace("_"," ")} · {vendor.city}
          </div>
        </div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"5px",
          padding:"4px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:600,
          background:`${vcfg.color}12`, color:vcfg.color,
          border:`1px solid ${vcfg.color}25`, textTransform:"capitalize" }}>
          {isApproved && <span style={{display:"flex"}}>{Ic.ok}</span>}
          {vcfg.label}
        </div>
      </div>

      {/* Global alert */}
      {msg.text && (
        <Alert text={msg.text} type={msg.type} onClose={()=>setMsg({type:"",text:""})} />
      )}

      {/* Verification banner */}
      {!isApproved && (
        <div style={{ background:`${vcfg.color}08`, border:`1px solid ${vcfg.color}22`,
          borderRadius:"12px", padding:"14px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px" }}>
            <span style={{color:vcfg.color,display:"flex"}}>{Ic.warning}</span>
            <span style={{ fontWeight:700, color:vcfg.color, fontSize:"13px" }}>{vcfg.label}</span>
          </div>
          <p style={{ fontSize:"12px", color:"var(--text2)", margin:"0 0 10px" }}>
            {vendor.verificationStatus==="pending"
              ? "Your documents are under review. You cannot list products yet."
              : "Re-upload your certificate after fixing the issue below."}
          </p>
          {vendor.verificationStatus==="rejected" && vendor.rejectionReason && (
            <div style={{fontSize:"12px",color:"var(--red)",marginBottom:"10px",fontWeight:600}}>
              Reason: {vendor.rejectionReason}
            </div>
          )}
          <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:"8px",
            padding:"12px 14px", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px",
              fontWeight:600, color:"var(--text2)", marginBottom:"8px" }}>
              <span style={{display:"flex"}}>{Ic.upload}</span>
              {vendor.certificateUrl?"Replace Certificate":"Upload License / FSSAI Certificate"}
            </div>
            {vendor.certificateUrl && (
              <div style={{fontSize:"11px",color:"var(--green)",marginBottom:"7px"}}>
                Current file: <a href={vendor.certificateUrl} target="_blank" rel="noreferrer"
                  style={{color:"var(--accent)"}}>View</a>
              </div>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload}
              disabled={uploading} style={{fontSize:"12px",color:"var(--text2)"}} />
            {uploading && <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"5px"}}>Uploading…</div>}
          </div>
        </div>
      )}

      {/* Tabs — pill switcher, centred, never touches edges */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ display:"inline-flex", gap:"3px", padding:"3px",
          background:"rgba(255,255,255,0.03)", borderRadius:"10px",
          border:"1px solid rgba(255,255,255,0.07)" }}>
          {[
            { key:"overview",  label:"Overview"    },
            { key:"orders",    label:"Orders"      },
            { key:"products",  label:"My Products" },
          ].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              padding:"7px 20px", borderRadius:"8px", fontSize:"12px",
              fontWeight:tab===t.key?700:500,
              background:tab===t.key?"var(--surface)":"transparent",
              border:tab===t.key?"1px solid rgba(255,255,255,0.09)":"1px solid transparent",
              color:tab===t.key?"var(--accent)":"var(--text3)",
              cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
              boxShadow:tab===t.key?"0 2px 8px rgba(0,0,0,0.25)":"none",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab==="overview" && (
        <OverviewTab vendor={vendor} orders={orders} products={products} onTabChange={setTab} />
      )}

      {tab==="orders" && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
            <span style={{fontSize:"11px",color:"var(--text3)"}}>
              {lastRefreshed&&`Updated ${lastRefreshed.toLocaleTimeString("en-IN")} · auto-refreshes every 30s`}
            </span>
            <button onClick={()=>refreshOrders(false)} disabled={refreshing}
              style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 13px",
                borderRadius:"7px",fontSize:"12px",fontWeight:600,cursor:"pointer",
                background:"rgba(255,255,255,0.03)",color:"var(--text2)",
                border:"1px solid rgba(255,255,255,0.08)",opacity:refreshing?0.6:1}}>
              {Ic.refresh} {refreshing?"Refreshing…":"Refresh"}
            </button>
          </div>

          {cancelled.length>0 && (
            <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",
              background:"rgba(239,68,68,0.05)",borderRadius:"9px",
              border:"1px solid rgba(239,68,68,0.14)"}}>
              <span style={{color:"var(--red)",display:"flex"}}>{Ic.warning}</span>
              <div>
                <div style={{fontWeight:600,fontSize:"12px",color:"var(--red)"}}>
                  {cancelled.length} cancelled order{cancelled.length>1?"s":""}
                </div>
                <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"1px"}}>
                  Review cancellation reasons and restock if needed.
                </div>
              </div>
            </div>
          )}

          {orders.length===0?(
            <div style={{...card,display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:"6px",padding:"48px",
              color:"var(--text3)",fontSize:"12px",textAlign:"center"}}>
              <div style={{fontSize:"22px",opacity:0.25}}>📦</div>
              <div style={{fontWeight:600,color:"var(--text2)"}}>No orders yet</div>
            </div>
          ):(
            orders.map(o=><OrderCard key={o._id} order={o} onStatusUpdate={updateStatus}/>)
          )}
        </div>
      )}

      {tab==="products" && (
        <ProductsTab products={products} isApproved={isApproved} token={token} onRefresh={loadAll} />
      )}
    </div>
  );
}