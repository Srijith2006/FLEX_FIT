import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const STATUS_FLOW = ["pending","confirmed","preparing","shipped","delivered"];
const STATUS_COLORS = { pending:"var(--gold)", confirmed:"var(--accent2)", preparing:"var(--accent)", shipped:"var(--accent3)", delivered:"var(--green)", cancelled:"var(--red)" };
const STATUS_ICONS  = { pending:"⏳", confirmed:"✅", preparing:"👨‍🍳", shipped:"🚚", delivered:"📦", cancelled:"✕" };
const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };

export default function VendorDashboard() {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [filter, setFilter]     = useState("all");
  const [msg, setMsg]           = useState({ type:"", text:"" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ name:"", category:"supplement", price:"", description:"", unit:"", stock:"100", calories:"", protein:"", carbs:"", fat:"" });

  const load = async () => {
    try {
      setLoading(true);
      const [oRes, pRes] = await Promise.all([
        api.get("/orders/vendor",         { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/vendors/products/mine", { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      setOrders(oRes.data.orders || []);
      setProducts(pRes.data.products || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status }, { headers:{ Authorization:`Bearer ${token}` } });
      setOrders(prev => prev.map(o => o._id === orderId ? {...o, status} : o));
      setMsg({ type:"success", text:`Order marked as ${status}!` });
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Update failed." });
    }
  };

  const addProduct = async () => {
    if (!form.name || !form.price) { setMsg({ type:"error", text:"Name and price required." }); return; }
    setSaving(true);
    try {
      await api.post("/vendors/products", {
        ...form,
        price:Number(form.price), stock:Number(form.stock)||0,
        calories:Number(form.calories)||0, protein:Number(form.protein)||0,
        carbs:Number(form.carbs)||0, fat:Number(form.fat)||0,
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setMsg({ type:"success", text:"Product added!" });
      setShowForm(false);
      setForm({ name:"", category:"supplement", price:"", description:"", unit:"", stock:"100", calories:"", protein:"", carbs:"", fat:"" });
      load();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed." });
    } finally { setSaving(false); }
  };

  const delProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/vendors/products/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch {}
  };

  if (loading) return <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"></div></div>;

  const filtered     = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const revenue      = orders.filter(o => o.status === "delivered").reduce((s,o) => s+o.total, 0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div className="grid-4">
        {[
          { icon:"📦", label:"Total Orders",  value:orders.length,  color:"var(--accent)"  },
          { icon:"⏳", label:"Pending",        value:pendingCount,   color:"var(--gold)"    },
          { icon:"🛍️",label:"Products",       value:products.length,color:"var(--accent2)" },
          { icon:"💰", label:"Revenue",        value:`₹${revenue.toLocaleString("en-IN")}`, color:"var(--green)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{fontSize:"22px",marginBottom:"8px"}}>{s.icon}</div>
            <div className="stat-card-value" style={{color:s.color,fontSize:"26px"}}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>
          {msg.text}
          <button onClick={()=>setMsg({type:"",text:""})} style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit",fontSize:"16px"}}>✕</button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${activeTab==="orders"?"active":""}`} onClick={()=>setActiveTab("orders")}>
          📦 Orders {pendingCount>0&&<span style={{background:"var(--red)",color:"#fff",fontSize:"10px",fontWeight:700,padding:"1px 6px",borderRadius:"10px",marginLeft:"4px"}}>{pendingCount}</span>}
        </button>
        <button className={`tab-btn ${activeTab==="products"?"active":""}`} onClick={()=>setActiveTab("products")}>🛍️ Products</button>
      </div>

      {activeTab === "orders" && (
        <div className="card">
          <div className="flex-between mb-4">
            <h3 className="font-heading" style={{fontSize:"20px"}}>Order Queue</h3>
            <select className="form-select" style={{maxWidth:"160px",fontSize:"12px"}} value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Orders</option>
              {[...STATUS_FLOW,"cancelled"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          {filtered.length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No {filter==="all"?"":filter} orders.</div></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {filtered.map(o => {
                const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status)+1];
                return (
                  <div key={o._id} style={{background:"var(--bg3)",border:`1px solid ${o.status==="delivered"?"rgba(16,185,129,0.3)":"var(--border)"}`,borderRadius:"var(--radius)",padding:"16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"10px"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"4px"}}>
                          <span style={{fontWeight:700,fontSize:"12px",color:"var(--text3)"}}>#{String(o._id).slice(-8).toUpperCase()}</span>
                          <span style={{fontSize:"12px",fontWeight:700,color:STATUS_COLORS[o.status]}}>{STATUS_ICONS[o.status]} {o.status?.toUpperCase()}</span>
                        </div>
                        <div style={{fontWeight:600,fontSize:"14px",marginBottom:"4px"}}>{o.items?.map(i=>`${i.name} ×${i.quantity}`).join(", ")}</div>
                        <div style={{fontSize:"12px",color:"var(--text3)"}}>{o.client?.user?.name} · {o.client?.user?.email}</div>
                        {o.deliveryAddress && <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"3px"}}>📍 {o.deliveryAddress}</div>}
                        {o.deliveryPhone   && <div style={{fontSize:"11px",color:"var(--text3)"}}>📞 {o.deliveryPhone}</div>}
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"var(--accent)"}}>₹{o.total}</div>
                        <div style={{fontSize:"11px",color:"var(--text3)"}}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:"4px",marginBottom:"10px"}}>
                      {STATUS_FLOW.map((s,i)=>(
                        <div key={s} style={{flex:1,height:"4px",borderRadius:"2px",background:STATUS_FLOW.indexOf(o.status)>=i?STATUS_COLORS[o.status]:"var(--border)"}}/>
                      ))}
                    </div>
                    {nextStatus && o.status!=="cancelled" && (
                      <button className="btn btn-primary btn-sm btn-full" style={{fontSize:"12px"}}
                        onClick={()=>updateStatus(o._id,nextStatus)}>
                        Mark as {nextStatus.charAt(0).toUpperCase()+nextStatus.slice(1)} →
                      </button>
                    )}
                    {o.status==="delivered" && <div style={{textAlign:"center",fontSize:"12px",color:"var(--green)",fontWeight:700}}>✓ Delivered</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="card">
          <div className="flex-between mb-4">
            <h3 className="font-heading" style={{fontSize:"20px"}}>My Products ({products.length})</h3>
            <button className="btn btn-accent btn-sm" onClick={()=>setShowForm(f=>!f)}>{showForm?"✕ Cancel":"+ Add Product"}</button>
          </div>

          {showForm && (
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"16px",marginBottom:"16px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" placeholder="Product name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {["supplement","meal","equipment","apparel","other"].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows="2" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
                  <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Unit</label><input className="form-input" placeholder="kg, bottle…" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Stock</label><input className="form-input" type="number" min="0" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
                </div>
                {(form.category==="meal"||form.category==="supplement") && (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px"}}>
                    {[["calories","kcal"],["protein","g protein"],["carbs","g carbs"],["fat","g fat"]].map(([f2,l])=>(
                      <div key={f2} className="form-group"><label className="form-label">{l}</label><input className="form-input" type="number" min="0" value={form[f2]} onChange={e=>setForm(f=>({...f,[f2]:e.target.value}))}/></div>
                    ))}
                  </div>
                )}
                <button className="btn btn-accent" onClick={addProduct} disabled={saving}>{saving?"Adding…":"Add Product"}</button>
              </div>
            </div>
          )}

          {products.length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">🛍️</div><div className="empty-state-text">No products yet.</div></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {products.map(p=>(
                <div key={p._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius)"}}>
                  <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                    <span style={{fontSize:"22px"}}>{CATEGORY_ICONS[p.category]||"📦"}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:"14px"}}>{p.name}</div>
                      <div style={{fontSize:"11px",color:"var(--text3)"}}>₹{p.price} · {p.unit} · Stock: {p.stock} · Sold: {p.totalSold||0}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                    <span className={`tag ${p.isAvailable?"tag-approved":"tag-rejected"}`}>{p.isAvailable?"Live":"Hidden"}</span>
                    <button className="btn btn-danger btn-sm" onClick={()=>delProduct(p._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}