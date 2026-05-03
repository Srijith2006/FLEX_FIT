import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import GroupChat from "./GroupChat.jsx";

export default function GroupChatList() {
  const { token } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/group-chat/mine", { headers: { Authorization: `Bearer ${token}` } });
        const c = res.data.chats || [];
        setChats(c);
        if (c.length > 0) setActiveProgram(c[0].program);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (chats.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">💬</div>
        <div className="empty-state-text">No group chats yet. Enroll in a program to join its group chat.</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Program selector */}
      {chats.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {chats.map(c => (
            <button
              key={c.program._id}
              className={`btn btn-sm ${activeProgram?._id === c.program?._id ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveProgram(c.program)}
            >
              {c.program?.title}
              {c.memberCount > 0 && (
                <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--text3)" }}>
                  ({c.memberCount})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Chat preview list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {chats.filter(c => !activeProgram || c.program?._id === activeProgram?._id || chats.length <= 3).slice(0, 1).map(c => (
          <div key={c.program._id}>
            {/* Last message preview */}
            {c.lastMessage && (
              <div style={{ padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: "10px", fontSize: "13px", color: "var(--text2)" }}>
                <strong>{c.lastMessage.sender?.name}:</strong> {c.lastMessage.message?.slice(0, 80)}{c.lastMessage.message?.length > 80 ? "…" : ""}
              </div>
            )}
            {activeProgram && <GroupChat program={activeProgram} />}
          </div>
        ))}
      </div>
    </div>
  );
}