import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };
const CATEGORIES = [
  { value:"", label:"All" },
  { value:"supplement", label:"Supplements 💊" },
  { value:"meal",       label:"Meals 🥗" },
  { value:"equipment",  label:"Equipment 🏋️" },
  { value:"apparel",    label:"Apparel 👕" },
];

export default function TrainerRecommendProducts() {
  const { token } = useAuth();
  const [programs, setPrograms]         = useState([]);
  const [products, setProducts]         = useState([]);
  const [recs, setRecs]                 = useState([]);
  const [selectedProg, setSelectedProg] = useState("");
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState("");
  const [note, setNote]                 = useState("");
  const [addingId, setAddingId]         = useState(null);
  const [msg, setMsg]                   = useState({ type:"", text:"" });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Load trainer's programs
  useEffect(() => {
    api.get("/programs/mine", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => {
        const progs = r.data.programs || [];
        setPrograms(progs);
        if (progs.length > 0) setSelectedProg(progs[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingPrograms(false));
  }, [token]);

  // Load all marketplace products
  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    api.get("/marketplace/products", { params })
      .then(r => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [category]);

  // Load existing recommendations for selected program
  useEffect(() => {
    if (!selectedProg) { setRecs([]); return; }
    api.get(`/marketplace/recommendations/${selectedProg}`)
      .then(r => setRecs(r.data.recommendations || []))
      .catch(() => setRecs([]));
  }, [selectedProg]);

  const addRec = async (productId) => {
    if (!selectedProg) { setMsg({ type:"error", text:"Please select a program first." }); return; }
    setAddingId(productId);
    setMsg({ type:"", text:"" });
    try {
      await api.post("/marketplace/recommendations", {
        programId: selectedProg, productId, note: note.trim(),
      }, { headers:{ Authorization:`Bearer ${token}` } });

      setMsg({ type:"success", text:"✅ Product recommended! Enrolled clients will now see it." });
      setNote("");

      // Refresh recommendations list
      const r = await api.get(`/marketplace/recommendations/${selectedProg}`);
      setRecs(r.data.recommendations || []);
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed to add recommendation." });
    } finally { setAddingId(null); }
  };

  const removeRec = async (recId) => {
    try {
      await api.delete(`/marketplace/recommendations/${recId}`, {
        headers:{ Authorization:`Bearer ${token}` },
      });
      setRecs(prev => prev.filter(r => r._id !== recId));
      setMsg({ type:"success", text:"Recommendation removed." });
    } catch {
      setMsg({ type:"error", text:"Failed to remove recommendation." });
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const recProductIds = new Set(recs.map(r => String(r.product?._id)));
  const selectedProgram = programs.find(p => p._id === selectedProg);

  if (loadingPrograms) return (
    <div className="card loading-screen" style={{minHeight:"200px"}}>
      <div className="spinner"></div>
    </div>
  );

  if (programs.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-text">
          You need to create and publish a program first before recommending products to clients.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Header info */}
      <div className="card" style={{ padding:"16px", background:"rgba(0,112,243,0.04)", border:"1px solid rgba(0,112,243,0.15)" }}>
        <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"6px" }}>⭐ Recommend Products to Clients</div>
        <div style={{ fontSize:"13px", color:"var(--text2)" }}>
          Pick products from the marketplace to recommend to clients enrolled in your programs.
          They'll see a "Trainer Recommended" section at the top of their marketplace view.
        </div>
      </div>

      {/* Program + Note selector */}
      <div className="card" style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", gap:"12px", alignItems:"flex-end", flexWrap:"wrap" }}>
          <div className="form-group" style={{ gap:"4px", flex:1, minWidth:"200px" }}>
            <label className="form-label">Select Program to Recommend For</label>
            <select className="form-select" value={selectedProg}
              onChange={e => setSelectedProg(e.target.value)}>
              <option value="">Choose a program…</option>
              {programs.map(p => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.enrolledCount || 0} enrolled)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gap:"4px", flex:2, minWidth:"200px" }}>
            <label className="form-label">Your note to clients (optional)</label>
            <input className="form-input"
              placeholder='e.g. "Take this post-workout for best recovery"'
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        {selectedProgram && (
          <div style={{ marginTop:"10px", fontSize:"12px", color:"var(--text3)" }}>
            Recommending for: <strong style={{color:"var(--text)"}}>{selectedProgram.title}</strong>
            {selectedProgram.enrolledCount > 0
              ? ` — ${selectedProgram.enrolledCount} client${selectedProgram.enrolledCount > 1 ? "s" : ""} enrolled`
              : " — No clients enrolled yet"}
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>
          {msg.text}
          <button onClick={() => setMsg({type:"",text:""})}
            style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit",fontSize:"16px"}}>✕</button>
        </div>
      )}

      <div className="grid-2" style={{ alignItems:"start" }}>

        {/* Current recommendations */}
        <div className="card">
          <h4 style={{ fontWeight:700, fontSize:"16px", marginBottom:"14px" }}>
            ⭐ Currently Recommended
            <span style={{ fontSize:"12px", color:"var(--text3)", marginLeft:"8px", fontFamily:"'DM Sans',sans-serif" }}>
              {recs.length} product{recs.length !== 1 ? "s" : ""}
            </span>
          </h4>

          {recs.length === 0 ? (
            <div className="empty-state" style={{ padding:"28px" }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">
                No recommendations yet for this program.<br/>
                Add products from the catalogue on the right.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {recs.map(rec => (
                <div key={rec._id} style={{
                  display:"flex", gap:"10px", alignItems:"flex-start",
                  padding:"12px", background:"var(--bg3)",
                  border:"1px solid var(--border)", borderRadius:"var(--radius)",
                }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"10px",
                    background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"20px", flexShrink:0,
                  }}>
                    {CATEGORY_ICONS[rec.product?.category]||"📦"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:"13px" }}>{rec.product?.name}</div>
                    <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                      {rec.product?.vendor?.businessName} · ₹{rec.product?.price}
                    </div>
                    {rec.note && (
                      <div style={{ fontSize:"11px", color:"var(--accent2)", marginTop:"3px", fontStyle:"italic" }}>
                        💬 "{rec.note}"
                      </div>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm"
                    style={{ padding:"4px 10px", fontSize:"11px", flexShrink:0 }}
                    onClick={() => removeRec(rec._id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product catalogue */}
        <div className="card">
          <h4 style={{ fontWeight:700, fontSize:"16px", marginBottom:"12px" }}>🛍️ Product Catalogue</h4>

          {/* Category filter */}
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
            {CATEGORIES.map(c => (
              <button key={c.value}
                className={`btn btn-sm ${category===c.value?"btn-primary":"btn-outline"}`}
                style={{ fontSize:"11px", padding:"4px 10px" }}
                onClick={() => setCategory(c.value)}>
                {c.label}
              </button>
            ))}
          </div>

          <input className="form-input" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginBottom:"12px" }} />

          {loadingProducts ? (
            <div className="loading-screen" style={{minHeight:"120px"}}>
              <div className="spinner"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{padding:"24px"}}>
              <div className="empty-state-icon">🛍️</div>
              <div className="empty-state-text">No products found.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:"480px", overflowY:"auto" }}>
              {filtered.map(p => {
                const isAdded = recProductIds.has(String(p._id));
                return (
                  <div key={p._id} style={{
                    display:"flex", gap:"10px", alignItems:"center",
                    padding:"10px 12px", background:"var(--bg3)",
                    border:`1px solid ${isAdded?"var(--green)":"var(--border)"}`,
                    borderRadius:"var(--radius)", transition:"border-color 0.15s",
                  }}>
                    <div style={{
                      width:"36px", height:"36px", borderRadius:"10px",
                      background:"var(--surface2)", display:"flex",
                      alignItems:"center", justifyContent:"center",
                      fontSize:"18px", flexShrink:0,
                    }}>
                      {CATEGORY_ICONS[p.category]||"📦"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:"13px", lineHeight:"1.3" }}>{p.name}</div>
                      <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                        {p.vendor?.businessName} · ₹{p.price}
                        {p.protein > 0 && ` · ${p.protein}g protein`}
                        {p.totalSold > 0 && ` · ${p.totalSold} sold`}
                      </div>
                    </div>
                    {isAdded ? (
                      <span className="tag tag-approved" style={{ fontSize:"10px", flexShrink:0 }}>✓ Added</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding:"5px 12px", fontSize:"11px", flexShrink:0 }}
                        disabled={addingId === p._id || !selectedProg}
                        onClick={() => addRec(p._id)}
                      >
                        {addingId === p._id
                          ? <><span className="spinner" style={{width:"10px",height:"10px",borderTopColor:"#fff"}}></span></>
                          : "+ Recommend"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}