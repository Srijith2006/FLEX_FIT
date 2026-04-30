import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import useAuth from "../hooks/useAuth.js";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("online_users", (users) => setOnlineUsers(users));

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);