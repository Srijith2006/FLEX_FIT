import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import { useSocket } from "../../context/SocketContext.jsx";
import ChatWindow from "../common/ChatWindow.jsx";

export default function Inbox() {
  const { token, user } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);   // people you CAN message (trainers/clients)
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [search, setSearch] = useState("");

  const loadInbox = async () => {
    try {
      const res = await api.get("/messages/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data.conversations || []);
    } catch {}
  };

  const loadContacts = async () => {
    try {
      // Clients → fetch enrolled program trainers
      // Trainers → fetch clients from coaching relationships
      if (user.role === "client") {
        const res = await api.get("/programs/enrolled", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const enrollments = res.data.enrollments || [];
        // Extract unique trainer users
        const seen = new Set();
        const trainers = [];
        for (const e of enrollments) {
          const tu = e.program?.trainer?.user;
          if (tu && !seen.has(tu._id)) {
            seen.add(tu._id);
            trainers.push({ _id: tu._id, name: tu.name, email: tu.email, role: "trainer" });
          }
        }
        // Also fetch trainers from coaching relationships
        const cRes = await api.get("/coaching/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        for (const r of cRes.data.relationships || []) {
          const tu = r.trainer?.user;
          if (tu && !seen.has(tu._id)) {
            seen.add(tu._id);
            trainers.push({ _id: tu._id, name: tu.name, email: tu.email, role: "trainer" });
          }
        }
        setContacts(trainers);
      } else if (user.role === "trainer") {
        const res = await api.get("/coaching/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const seen = new Set();
        const clients = [];
        for (const r of res.data.relationships || []) {
          const cu = r.client?.user;
          if (cu && !seen.has(cu._id)) {
            seen.add(cu._id);
            clients.push({ _id: cu._id, name: cu.name, email: cu.email, role: "client" });
          }
        }
        // Also get clients from program enrollments
        const pRes = await api.get("/programs/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        for (const prog of pRes.data.programs || []) {
          // fetch enrollments for each program
          try {
            const eRes = await api.get(`/programs/${prog._id}/enrollments`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            for (const e of eRes.data.enrollments || []) {
              const cu = e.client?.user;
              if (cu && !seen.has(cu._id)) {
                seen.add(cu._id);
                clients.push({ _id: cu._id, name: cu.name, email: cu.email, role: "client" });
              }
            }
          } catch {}
        }
        setContacts(clients);
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadInbox(), loadContacts()]);
      setLoading(false);
    })();
  }, [token]);

  // Merge contacts + existing conversations so all appear
  const conversationUserIds = new Set(conversations.map(c => String(c.user._id)));
  const newContacts = contacts.filter(c => !conversationUserIds.has(String(c._id)));

  const filteredConversations = conversations.filter(c =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = newContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (userObj) => {
    setActiveChat(userObj);
    // Refresh inbox after a moment to pick up any new conversation
    setTimeout(loadInbox, 800);
  };

  const UserRow = ({ u, lastMsg }) => {
    const isOnline = onlineUsers.includes(String(u._id));
    const initials = u.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
    const isActive = activeChat?._id === u._id;

    return (
      <div
        onClick={() => openChat(u)}
        style={{
          display: "flex", gap: "12px", alignItems: "center",
          padding: "12px 14px", borderRadius: "var(--radius)",
          background: isActive ? "rgba(0,112,243,0.1)" : "var(--bg3)",
          border: `1px solid ${isActive ? "var(--accent2)" : "var(--border)"}`,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            className="nav-avatar"
            style={{ width: "44px", height: "44px", fontSize: "16px", borderRadius: "12px" }}
          >
            {initials}
          </div>
          {isOnline && (
            <div style={{
              position: "absolute", bottom: -2, right: -2,
              width: "11px", height: "11px",
              background: "var(--green)", borderRadius: "50%",
              border: "2px solid var(--bg3)",
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>{u.name}</span>
            <span className={`nav-badge ${u.role === "trainer" ? "badge-trainer" : "badge-client"}`}>
              {u.role}
            </span>
          </div>
          <div style={{
            fontSize: "12px", color: lastMsg ? "var(--text2)" : "var(--text3)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {lastMsg || (isOnline ? "🟢 Online — start chatting" : "Tap to start conversation")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="font-heading" style={{ fontSize: "22px" }}>Messages</h3>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>
            {onlineUsers.length > 0 && `${onlineUsers.length} online`}
          </div>
        </div>

        {/* Search */}
        <input
          className="form-input"
          placeholder="Search conversations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "14px" }}
        />

        {loading ? (
          <div className="loading-screen" style={{ minHeight: "160px" }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

            {/* Existing conversations */}
            {filteredConversations.length > 0 && (
              <>
                {filteredConversations.map(({ user: u, lastMessage }) => (
                  <UserRow key={u._id} u={u} lastMsg={lastMessage?.message} />
                ))}
              </>
            )}

            {/* New contacts (no conversation yet) */}
            {filteredContacts.length > 0 && (
              <>
                {filteredConversations.length > 0 && (
                  <div style={{
                    fontSize: "11px", fontWeight: 700, color: "var(--text3)",
                    textTransform: "uppercase", letterSpacing: "0.8px",
                    padding: "10px 4px 4px",
                  }}>
                    New Conversation
                  </div>
                )}
                {filteredContacts.map(u => (
                  <UserRow key={u._id} u={u} lastMsg={null} />
                ))}
              </>
            )}

            {/* No one to message */}
            {filteredConversations.length === 0 && filteredContacts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <div className="empty-state-text">
                  {user.role === "client"
                    ? "Enroll in a program or select a trainer to start messaging."
                    : "Your clients will appear here once they enroll or connect with you."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating chat window */}
      {activeChat && (
        <ChatWindow
          otherUser={activeChat}
          onClose={() => setActiveChat(null)}
        />
      )}
    </>
  );
}