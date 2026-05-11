import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function ClientList({ onNavigate }) {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Fetching clients assigned to this trainer
        const res = await api.get("/trainers/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(res.data.clients || []);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [token]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Search and Header ── */}
      <div className="card" style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Assigned Clients</h3>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text3)" }}>
            Monitor progress and manage schedules for {clients.length} active members.
          </p>
        </div>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search clients..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
      </div>

      {/* ── Clients Grid ── */}
      {filteredClients.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">No clients found matching your search.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredClients.map((client) => (
            <div key={client._id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {/* Avatar with Initials */}
                <div style={{ 
                  width: "50px", height: "50px", borderRadius: "14px", 
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, color: "#fff", fontSize: "18px"
                }}>
                  {client.name?.[0].toUpperCase()}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{client.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {client.goalType || "General Training"}
                  </div>
                </div>
              </div>

              {/* Personal Details Table */}
              <div style={{ 
                background: "var(--bg3)", padding: "12px", borderRadius: "10px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"
              }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text3)" }}>WEIGHT</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{client.currentWeight || "--"} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text3)" }}>TARGET</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{client.targetWeight || "--"} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text3)" }}>HEIGHT</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{client.height || "--"} cm</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text3)" }}>AGE</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{client.age || "--"} yrs</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => onNavigate?.("messages")}
                >
                  Message
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => onNavigate?.("clientproofs")}
                >
                  View Proofs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}