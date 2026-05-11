import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import { registerPushNotifications } from "../services/pushNotificationService.js";

// Client components
import ClientOverview       from "../components/client/ClientOverview.jsx";
import ProgramMarketplace   from "../components/client/ProgramMarketplace.jsx";
import MyRegisteredPrograms from "../components/client/MyRegisteredPrograms.jsx";
import TrainerBrowse        from "../components/client/TrainerBrowse.jsx";
import WorkoutLogger        from "../components/client/WorkoutLogger.jsx";
import ProgressTracker      from "../components/client/ProgressTracker.jsx";
import ClientProfile        from "../components/client/ClientProfile.jsx";
import ClientDietLog        from "../components/client/ClientDietLog.jsx";
import ProofOfWork          from "../components/client/ProofOfWork.jsx";
import MyRewards            from "../components/client/MyRewards.jsx";
import Leaderboard          from "../components/common/Leaderboard.jsx";

// Trainer components
import TrainerOverview       from "../components/trainer/TrainerOverview.jsx";
import TrainerProfileView    from "../components/trainer/TrainerProfileView.jsx";
import TrainerProgramManager from "../components/trainer/TrainerProgramManager.jsx";
import TrainerProgramBuilder from "../components/trainer/TrainerProgramBuilder.jsx";
import LiveSessionManager    from "../components/trainer/LiveSessionManager.jsx";
import VerificationStatus    from "../components/trainer/VerificationStatus.jsx";
import TrainerDietPlanBuilder from "../components/trainer/TrainerDietPlanBuilder.jsx";
import ClientProofFeed       from "../components/trainer/ClientProofFeed.jsx";
import TrainerRecommendProducts from "../components/trainer/TrainerRecommendProducts.jsx";
import ClientList            from "../components/trainer/ClientList.jsx";

// Shared
import Inbox         from "../components/common/Inbox.jsx";
import GroupChatList from "../components/common/GroupChatList.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";
import VendorDashboard from "../components/Vendor/VendorDashboard.jsx";

const ESSENTIAL_TABS = [
  { id: "overview",  icon: "🏠", label: "Home" },
  { id: "messages",  icon: "💬", label: "Messages" },
  { id: "groupchat", icon: "👥", label: "Community" },
  { id: "profile",   icon: "👤", label: "My Profile" },
];

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const isClient  = user?.role === "client";
  const isTrainer = user?.role === "trainer";
  const isVendor  = user?.role === "vendor";
  const isAdmin   = user?.role === "admin";

  useEffect(() => {
    if (token) registerPushNotifications(token).catch(() => {});
  }, [token]);

  const roleColor = { client:"#0070f3", trainer:"#10b981", vendor:"#f59e0b", admin:"#ef4444" }[user?.role] || "#0070f3";

  const allTabs = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "myprograms", label: "My Programs", icon: "📋" },
    { id: "clients", label: "My Clients", icon: "💎" },
    { id: "manage", label: "Manage Programs", icon: "📋" },
    { id: "builder", label: "Program Builder", icon: "➕" },
    { id: "marketplace", label: "Marketplace", icon: "🏪" },
    { id: "trainers", label: "Trainers", icon: "🔍" },
    { id: "workouts", label: "Workout Log", icon: "🏋️" },
    { id: "progress", label: "Analytics", icon: "📈" },
    { id: "dietplan", label: "Nutrition/Diet", icon: "🥗" },
    { id: "proof", label: "Proof of Work", icon: "📸" },
    { id: "clientproofs", label: "Client Proofs", icon: "📸" },
    { id: "recommendations", label: "Recommend Products", icon: "⭐" },
    { id: "rewards", label: "Rewards", icon: "⚡" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
    { id: "messages", label: "Inbox", icon: "💬" },
    { id: "groupchat", label: "Community", icon: "👥" },
    { id: "verification", label: "Trainer Verification", icon: "✅" },
    { id: "profile", label: "Settings", icon: "👤" },
    { id: "sessions", label: "Live Sessions", icon: "🎥" }
  ];

  const activeInfo = allTabs.find(t => t.id === activeTab) || allTabs[0];

  const renderContent = () => {
    if (isAdmin)  return <AdminDashboard />;
    if (isVendor) return <VendorDashboard />;

    if (isClient) {
      if (activeTab === "overview")    return <ClientOverview onNavigate={setActiveTab} />;
      if (activeTab === "myprograms")  return <MyRegisteredPrograms />;
      if (activeTab === "marketplace") return <ProgramMarketplace />;
      if (activeTab === "trainers")    return <TrainerBrowse />;
      if (activeTab === "workouts")    return <WorkoutLogger />;
      if (activeTab === "progress")    return <ProgressTracker />;
      if (activeTab === "groupchat")   return <GroupChatList />;
      if (activeTab === "messages")    return <Inbox />;
      if (activeTab === "profile")     return <ClientProfile />;
      if (activeTab === "dietplan")    return <ClientDietLog />;
      if (activeTab === "proof")       return <ProofOfWork />;
      if (activeTab === "rewards")     return <MyRewards />;
      if (activeTab === "leaderboard") return <Leaderboard />;
    }

    if (isTrainer) {
      if (activeTab === "overview")     return <TrainerOverview onNavigate={setActiveTab} />;
      if (activeTab === "manage")       return <TrainerProgramManager />;
      if (activeTab === "builder")      return <TrainerProgramBuilder />;
      if (activeTab === "sessions")     return <LiveSessionManager />;
      if (activeTab === "groupchat")    return <GroupChatList />;
      if (activeTab === "messages")     return <Inbox />;
      if (activeTab === "verification") return <VerificationStatus />;
      if (activeTab === "profile")      return <TrainerProfileView />;
      if (activeTab === "dietplan")     return <TrainerDietPlanBuilder />;
      if (activeTab === "clientproofs") return <ClientProofFeed />;
      if (activeTab === "recommendations") return <TrainerRecommendProducts />;
      if (activeTab === "clients")      return <ClientList onNavigate={setActiveTab} />;
    }
    return null;
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width:"80px", flexShrink:0,
        background:"var(--bg2)", borderRight:"1px solid var(--border)",
        display:"flex", flexDirection:"column", alignItems:"center",
        position:"sticky", top:0, height:"100vh", padding: "24px 0"
      }}>
        {/* User Initial Circle */}
        <div style={{
          width:"42px", height:"42px", borderRadius:"12px", marginBottom: "32px",
          background:`linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, color:"#fff", fontSize: "18px"
        }}>
          {user?.name?.[0].toUpperCase()}
        </div>

        {/* Navigation Icons - Hidden for Vendor and Admin */}
        {!isVendor && !isAdmin && (
          <nav style={{ display:"flex", flexDirection:"column", gap:"20px", flex: 1 }}>
            {ESSENTIAL_TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                style={{
                  width:"48px", height:"48px", borderRadius:"14px", border:"none",
                  cursor:"pointer", fontSize:"22px", transition:"all 0.2s",
                  background: activeTab === tab.id ? `${roleColor}22` : "transparent",
                  color: activeTab === tab.id ? roleColor : "var(--text3)",
                }}
              >
                {tab.icon}
              </button>
            ))}
          </nav>
        )}

        {/* Spacer for Admin/Vendor to keep Logout at bottom */}
        {(isVendor || isAdmin) && <div style={{ flex: 1 }}></div>}

        {/* Vector Logout Button */}
        <button 
          onClick={logout}
          style={{ 
            background: "none", border: "none", cursor: "pointer", 
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "48px", height: "48px", transition: "opacity 0.2s" 
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
          title="Logout"
        >
          <svg 
            width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0.8 }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Header - Only shown for non-Vendor/Admin roles to keep their view full-screen */}
        {!isVendor && !isAdmin && (
          <div style={{
            padding:"16px 32px", borderBottom:"1px solid var(--border)",
            background:"var(--bg2)", display:"flex", alignItems:"center",
            justifyContent: "space-between", position:"sticky", top:0, zIndex:10,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
              <span style={{ fontSize:"24px" }}>{activeInfo.icon}</span>
              <h1 style={{ fontWeight:800, fontSize:"20px", color:"var(--text)", margin: 0 }}>
                {activeInfo.label}
              </h1>
            </div>

            {activeTab !== "overview" && (
              <button
                onClick={() => setActiveTab("overview")}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "10px", padding: "8px 16px",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer"
                }}
              >
                🏠 Back to Home
              </button>
            )}
          </div>
        )}

        {/* Component Display */}
        <div style={{ flex:1, padding:"32px", overflowY:"auto" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}