import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORY_ICONS = { supplement:"💊", meal:"🥗", equipment:"🏋️", apparel:"👕", other:"📦" };

export default function TrainerRecommendProducts() {
  const { token } = useAuth();
  const [programs, setPrograms]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [recs, setRecs]           = useState([]);
  const [selectedProg, setSelectedProg] = useState("");
  const [search, setSearch]       = useState("");
  const [note, setNote]           = useState("");
  const [addingId, setAddingId]   = useState(null);
  const [msg, setMsg]             = useState({ type:"", text:"" });

  useEffect(() => {
    Promise.all([
      api.get("/programs/mine",           { headers:{ Authorization:`Bearer ${token}` } }),
      api.get("/marketplace/products"),
    ]).then(([pRes, mRes]) => {
      setPrograms(pRes.data.programs || []);
      setProducts(mRes.data.products || []);
      if (pRes.data.programs?.length > 0) setSelectedProg(pRes.data.programs[0]._id);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!selectedProg) return;
    api.get(`/marketplace/recommendations/${selectedProg}`)
      .then(r => setRecs(r.data.recommendations || []))
      .catch(() => {});
  }, [selectedProg]);

  const addRec = async (productId) => {
    if (!selectedProg) { setMsg({ type:"error", text:"Select a program first." }); return; }
    setAddingId(productId);
    try {
      await api.post("/marketplace/recommendations", {
        programId: selectedProg, productId, note,
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setMsg({ type:"success", text:"Product recommended to clients!" });
      setNote("");
      const r = await api.get(`/marketplace/recommendations/${selectedProg}`);
      setRecs(r.data.recommendations || []);
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed." });
    } finally { setAddingId(null); }
  };

  const removeRec = async (recId) => {
    try {
      await api.delete(`/marketplace/recommendations/${recId}`, { headers:{ Authorization:`Bearer ${token}` } });
      setRecs(prev => prev.filter(r => r._id !== recId));
    } catch {}
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const recProductIds = new Set(recs.map(r => String(r.product?._id)));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Program selector */}
      <div className="card" style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap" }}>
          <div className="form-group" style={{ gap:"4px", flex:1, minWidth:"180px" }}>
            <label className="form-label">Select Program</label>
            <select className="form-select" value={selectedProg} onChange={e => setSelectedProg(e.target.value)}>
              <option value="">Choose a program…</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gap:"4px", flex:2, minWidth:"200px" }}>
            <label className="form-label">Add a note for clients (optional)</label>
            <input className="form-input" placeholder='e.g. "Take post-workout for best results"'
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>
          {msg.text}
          <button onClick={() => setMsg({type:"",text:""})} style={{ background:"none", border:"none", marginLeft:"auto", cursor:"pointer", color:"inherit" }}>✕</button>
        </div>
      )}

      <div className="grid-2" style={{ alignItems:"start" }}>
        {/* Current recommendations */}
        <div className="card">
          <h4 style={{ fontWeight:700, fontSize:"16px", marginBottom:"14px" }}>
            ⭐ Currently Recommended
            {selectedProg && <span style={{ fontSize:"12px", color:"var(--text3)", marginLeft:"8px" }}>({recs.length} products)</span>}
          </h4>
          {recs.length === 0 ? (
            <div className="empty-state" style={{ padding:"24px" }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No recommendations yet. Add products from the list.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {recs.map(rec => (
                <div key={rec._id} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 12px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
                  <span style={{ fontSize:"20px", flexShrink:0 }}>{CATEGORY_ICONS[rec.product?.category]||"📦"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:"13px" }}>{rec.product?.name}</div>
                    {rec.note && <div style={{ fontSize:"11px", color:"var(--text2)", marginTop:"2px" }}>{rec.note}</div>}
                    <div style={{ fontSize:"11px", color:"var(--text3)" }}>₹{rec.product?.price}</div>
                  </div>
                  <button className="btn btn-danger btn-sm" style={{ padding:"4px 10px", fontSize:"11px", flexShrink:0 }}
                    onClick={() => removeRec(rec._id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product catalogue */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <h4 style={{ fontWeight:700, fontSize:"16px" }}>🛍️ Product Catalogue</h4>
          </div>
          <input className="form-input" placeholder="Search products…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom:"12px" }} />
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:"420px", overflowY:"auto" }}>
            {filtered.map(p => (
              <div key={p._id} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 12px", background:"var(--bg3)", border:`1px solid ${recProductIds.has(String(p._id))?"var(--green)":"var(--border)"}`, borderRadius:"var(--radius)", transition:"border-color 0.15s" }}>
                <span style={{ fontSize:"20px", flexShrink:0 }}>{CATEGORY_ICONS[p.category]||"📦"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:"13px" }}>{p.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                    {p.vendor?.businessName} · ₹{p.price}
                    {p.protein > 0 && ` · ${p.protein}g protein`}
                  </div>
                </div>
                {recProductIds.has(String(p._id)) ? (
                  <span className="tag tag-approved" style={{ fontSize:"10px", flexShrink:0 }}>✓ Added</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ padding:"5px 12px", fontSize:"11px", flexShrink:0 }}
                    disabled={addingId === p._id || !selectedProg}
                    onClick={() => addRec(p._id)}
                  >
                    {addingId === p._id ? "…" : "+ Recommend"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}