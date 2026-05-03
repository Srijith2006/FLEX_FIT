import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import { useSocket } from "../../context/SocketContext.jsx";

function GroupBubble({ msg, isMine }) {
  const roleColor = { trainer: "var(--accent3)", client: "var(--accent2)", admin: "var(--gold)" }[msg.sender?.role] || "var(--accent2)";
  return (
    <div style={{ display: "flex", flexDirection: "column",
      alignItems: isMine ? "flex-end" : "flex-start", marginBottom: "10px" }}>
      {!isMine && (
        <div style={{ fontSize: "11px", color: roleColor, fontWeight: 700,
          marginBottom: "3px", paddingLeft: "4px" }}>
          {msg.sender?.name}
          {msg.sender?.role === "trainer" && " 🏋️"}
        </div>
      )}
      <div style={{
        maxWidth: "72%", padding: "10px 14px",
        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: msg.type === "announcement"
          ? "rgba(245,158,11,0.12)"
          : isMine ? "var(--accent2)" : "var(--surface2)",
        border: msg.type === "announcement" ? "1px solid rgba(245,158,11,0.3)" : "none",
        color: isMine ? "#fff" : "var(--text)",
        fontSize: "14px", lineHeight: "1.5",
      }}>
        {msg.type === "announcement" && (
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            📢 Announcement
          </div>
        )}
        <div style={{ wordBreak: "break-word" }}>{msg.message}</div>
        <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px",
          textAlign: isMine ? "right" : "left" }}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function GroupChat({ program }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const seenIds = useRef(new Set());
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // Load history
  useEffect(() => {
    if (!program?._id) return;
    seenIds.current.clear();
    setMessages([]);
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/group-chat/${program._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs = res.data.messages || [];
        msgs.forEach(m => seenIds.current.add(String(m._id)));
        setMessages(msgs);
        setMemberCount(res.data.memberCount || 0);
      } catch {} finally { setLoading(false); }
    })();
  }, [program?._id, token]);

  // Socket
  useEffect(() => {
    if (!socket || !program?._id) return;
    socket.emit("join_group", program._id);

    const onMsg = (msg) => {
      const id = String(msg._id);
      if (seenIds.current.has(id)) return;
      seenIds.current.add(id);
      setMessages(prev => [...prev, msg]);
    };

    const onTyping = ({ name, isTyping }) => {
      setTypingUsers(prev => isTyping
        ? [...new Set([...prev, name])]
        : prev.filter(n => n !== name));
    };

    socket.on("group_message", onMsg);
    socket.on("group_typing",  onTyping);

    return () => {
      socket.emit("leave_group", program._id);
      socket.off("group_message", onMsg);
      socket.off("group_typing",  onTyping);
    };
  }, [socket, program?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit("send_group_message", {
      programId: program._id,
      text: text.trim(),
      type: isAnnouncement ? "announcement" : "text",
    });
    setText("");
    setIsAnnouncement(false);
    clearTimeout(typingTimer.current);
    socket.emit("group_typing", { programId: program._id, isTyping: false });
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("group_typing", { programId: program._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("group_typing", { programId: program._id, isTyping: false });
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "560px" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg3)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px" }}>{program.title}</div>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>
            {memberCount} members · Program Group Chat
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%",
            background: "var(--green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "12px", color: "var(--green)" }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>Welcome to the group!</div>
            <div style={{ fontSize: "13px" }}>Start the conversation with your fellow members.</div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <GroupBubble
              key={msg._id || i}
              msg={msg}
              isMine={String(msg.sender?._id) === String(user._id)}
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div style={{ fontSize: "12px", color: "var(--text3)", padding: "4px 0" }}>
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Trainer announcement toggle */}
      {user?.role === "trainer" && (
        <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "8px", background: "var(--bg3)" }}>
          <input type="checkbox" id="announce-toggle" checked={isAnnouncement}
            onChange={e => setIsAnnouncement(e.target.checked)}
            style={{ accentColor: "var(--gold)" }} />
          <label htmlFor="announce-toggle" style={{ fontSize: "12px", color: "var(--gold)",
            fontWeight: 600, cursor: "pointer" }}>
            📢 Send as Announcement
          </label>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)",
        background: "var(--bg3)", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
        display: "flex", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKey}
          placeholder="Message the group…"
          rows={1}
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: "14px", padding: "10px 14px", color: "var(--text)",
            fontFamily: "'DM Sans',sans-serif", fontSize: "14px",
            resize: "none", outline: "none", lineHeight: "1.4", maxHeight: "100px",
          }}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
          }}
        />
        <button onClick={send} disabled={!text.trim()} style={{
          width: "40px", height: "40px", borderRadius: "12px", border: "none",
          background: text.trim() ? "var(--accent2)" : "var(--surface2)",
          cursor: text.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", flexShrink: 0, transition: "background 0.15s",
        }}>➤</button>
      </div>
    </div>
  );
}