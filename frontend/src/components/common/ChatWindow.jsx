import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import { useSocket } from "../../context/SocketContext.jsx";

function MessageBubble({ msg, isMine }) {
  return (
    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: "8px" }}>
      {!isMine && (
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
          background: "linear-gradient(135deg,var(--accent2),var(--accent3))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, color: "#fff", marginRight: "6px", alignSelf: "flex-end",
        }}>
          {(msg.sender?.name || "?")[0].toUpperCase()}
        </div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "10px 14px",
        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isMine ? "var(--accent2)" : "var(--surface2)",
        color: isMine ? "#fff" : "var(--text)",
        fontSize: "14px", lineHeight: "1.5",
      }}>
        <div style={{ wordBreak: "break-word" }}>{msg.message}</div>
        <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: isMine ? "right" : "left" }}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ otherUser, onClose }) {
  const { user, token } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const seenIds = useRef(new Set());

  const isOnline = onlineUsers.includes(String(otherUser._id));

  // Load history
  useEffect(() => {
    if (!otherUser?._id) return;
    seenIds.current.clear();
    setMessages([]);
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/messages/${otherUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs = res.data.messages || [];
        msgs.forEach(m => seenIds.current.add(String(m._id)));
        setMessages(msgs);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [otherUser._id, token]);

  // Add a message safely (deduplication)
  const addMessage = (msg) => {
    const id = String(msg._id);
    if (seenIds.current.has(id)) return;
    seenIds.current.add(id);
    setMessages(prev => [...prev, msg]);
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      const senderId = String(msg.sender?._id || msg.sender);
      const relevantIds = [String(otherUser._id), String(user._id)];
      if (relevantIds.includes(senderId)) addMessage(msg);
    };

    const onSent = (msg) => addMessage(msg);

    const onTyping = ({ senderId, isTyping: t }) => {
      if (String(senderId) === String(otherUser._id)) setIsTyping(t);
    };

    socket.on("receive_message", onReceive);
    socket.on("message_sent", onSent);
    socket.on("user_typing", onTyping);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_sent", onSent);
      socket.off("user_typing", onTyping);
    };
  }, [socket, otherUser._id, user._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!text.trim()) return;
    if (!socket?.connected) {
      // Fallback: send via REST if socket not connected
      (async () => {
        setSending(true);
        try {
          await api.post(`/messages/send`, {
            receiverId: String(otherUser._id),
            text: text.trim(),
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        setSending(false);
      })();
    } else {
      socket.emit("send_message", { receiverId: String(otherUser._id), text: text.trim() });
    }
    setText("");
    clearTimeout(typingTimer.current);
    socket?.emit("typing", { receiverId: String(otherUser._id), isTyping: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("typing", { receiverId: String(otherUser._id), isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing", { receiverId: String(otherUser._id), isTyping: false });
    }, 1500);
  };

  const initials = otherUser.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div style={{
      position: "fixed", bottom: "20px", right: "20px",
      width: "380px", height: "520px",
      background: "var(--surface)", border: "1px solid var(--border2)",
      borderRadius: "20px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column", zIndex: 200,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg3)", flexShrink: 0,
      }}>
        <div style={{ position: "relative" }}>
          <div className="nav-avatar" style={{ width: "38px", height: "38px", fontSize: "15px", borderRadius: "11px" }}>
            {initials}
          </div>
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: "10px", height: "10px",
            background: isOnline ? "var(--green)" : "var(--border2)",
            borderRadius: "50%", border: "2px solid var(--bg3)",
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{otherUser.name}</div>
          <div style={{ fontSize: "11px", color: isTyping ? "var(--accent)" : isOnline ? "var(--green)" : "var(--text3)" }}>
            {isTyping ? "✍ typing…" : isOnline ? "● Online" : "○ Offline"}
          </div>
        </div>
        <span className={`nav-badge ${otherUser.role === "trainer" ? "badge-trainer" : "badge-client"}`}>
          {otherUser.role}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "var(--text3)",
            cursor: "pointer", fontSize: "18px", padding: "0 4px", lineHeight: 1,
          }}
        >✕</button>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div className="spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>👋</div>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Start the conversation</div>
            <div style={{ fontSize: "12px" }}>Say hello to {otherUser.name}!</div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg._id || i}
                msg={msg}
                isMine={String(msg.sender?._id || msg.sender) === String(user._id)}
              />
            ))}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 0", color: "var(--text3)", fontSize: "12px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: "6px", height: "6px", background: "var(--text3)",
                      borderRadius: "50%",
                      animation: `bounce 1s ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                {otherUser.name.split(" ")[0]} is typing…
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px 12px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg3)", flexShrink: 0,
        display: "flex", gap: "8px", alignItems: "flex-end",
      }}>
        <textarea
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUser.name.split(" ")[0]}…`}
          rows={1}
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: "14px", padding: "10px 14px", color: "var(--text)",
            fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
            resize: "none", outline: "none", lineHeight: "1.4", maxHeight: "100px",
          }}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: text.trim() ? "var(--accent2)" : "var(--surface2)",
            border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0, transition: "background 0.15s",
          }}
        >
          {sending ? <div className="spinner" style={{ width: "14px", height: "14px", borderTopColor: "#fff" }} /> : "➤"}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}