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
import TrainerOverview          from "../components/trainer/TrainerOverview.jsx";
import TrainerProfileView       from "../components/trainer/TrainerProfileView.jsx";
import TrainerProgramManager    from "../components/trainer/TrainerProgramManager.jsx";
import TrainerProgramBuilder    from "../components/trainer/TrainerProgramBuilder.jsx";
import LiveSessionManager       from "../components/trainer/LiveSessionManager.jsx";
import VerificationStatus       from "../components/trainer/VerificationStatus.jsx";
import TrainerDietPlanBuilder   from "../components/trainer/TrainerDietPlanBuilder.jsx";
import ClientProofFeed          from "../components/trainer/ClientProofFeed.jsx";
import TrainerRecommendProducts from "../components/trainer/TrainerRecommendProducts.jsx";
import ClientList               from "../components/trainer/ClientList.jsx";

// Shared
import Inbox          from "../components/common/Inbox.jsx";
import GroupChatList  from "../components/common/GroupChatList.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";
import VendorDashboard from "../components/Vendor/VendorDashboard.jsx";

// ── SVG icon set — no emojis ─────────────────────────────────────────────────
const Icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  messages: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  community: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
};

const ESSENTIAL_TABS = [
  { id:"overview",  icon: Icons.home,      label:"Home"      },
  { id:"messages",  icon: Icons.messages,  label:"Messages"  },
  { id:"groupchat", icon: Icons.community, label:"Community" },
  { id:"profile",   icon: Icons.profile,   label:"Settings"  },
];

const ALL_TAB_LABELS = {
  overview:        "Dashboard",
  myprograms:      "My Programs",
  clients:         "My Clients",
  manage:          "Manage Programs",
  builder:         "Program Builder",
  marketplace:     "Marketplace",
  trainers:        "Find Trainers",
  workouts:        "Workout Log",
  progress:        "Analytics",
  dietplan:        "Nutrition & Diet",
  proof:           "Proof of Work",
  clientproofs:    "Client Proofs",
  recommendations: "Recommend Products",
  rewards:         "Rewards",
  leaderboard:     "Leaderboard",
  messages:        "Inbox",
  groupchat:       "Community",
  verification:    "Verification",
  profile:         "Settings",
  sessions:        "Live Sessions",
};

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

  const roleColor = {
    client:"#0070f3", trainer:"#10b981", vendor:"#f59e0b", admin:"#ef4444",
  }[user?.role] || "#0070f3";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

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
      if (activeTab === "overview")        return <TrainerOverview onNavigate={setActiveTab} />;
      if (activeTab === "manage")          return <TrainerProgramManager />;
      if (activeTab === "builder")         return <TrainerProgramBuilder />;
      if (activeTab === "sessions")        return <LiveSessionManager />;
      if (activeTab === "groupchat")       return <GroupChatList />;
      if (activeTab === "messages")        return <Inbox />;
      if (activeTab === "verification")    return <VerificationStatus />;
      if (activeTab === "profile")         return <TrainerProfileView />;
      if (activeTab === "dietplan")        return <TrainerDietPlanBuilder />;
      if (activeTab === "clientproofs")    return <ClientProofFeed />;
      if (activeTab === "recommendations") return <TrainerRecommendProducts />;
      if (activeTab === "clients")         return <ClientList onNavigate={setActiveTab} />;
    }
    return null;
  };

  const pageTitle   = ALL_TAB_LABELS[activeTab] || "Dashboard";
  const showSidebar = !isVendor && !isAdmin;
  const showHeader  = !isVendor && !isAdmin;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

      {/* ── Sidebar ── */}
      {showSidebar && (
        <aside style={{
          width:"64px", flexShrink:0,
          background:"var(--bg2)",
          borderRight:"1px solid rgba(255,255,255,0.05)",
          display:"flex", flexDirection:"column", alignItems:"center",
          position:"sticky", top:0, height:"100vh",
          padding:"20px 0",
        }}>

          {/* Avatar / brand mark */}
          <div style={{
            width:"36px", height:"36px", borderRadius:"10px", marginBottom:"28px",
            background:`linear-gradient(135deg, ${roleColor}cc, ${roleColor}55)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:800, color:"#fff", fontSize:"15px",
            letterSpacing:"-0.5px", flexShrink:0,
            boxShadow:`0 2px 12px ${roleColor}40`,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>

          {/* Nav icons */}
          <nav style={{ display:"flex", flexDirection:"column", gap:"4px", flex:1 }}>
            {ESSENTIAL_TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  style={{
                    width:"44px", height:"44px", borderRadius:"10px",
                    border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s",
                    background: active ? `${roleColor}18` : "transparent",
                    color: active ? roleColor : "var(--text3)",
                    position:"relative",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--text2)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text3)";
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div style={{
                      position:"absolute", left:0, top:"50%",
                      transform:"translateY(-50%)",
                      width:"3px", height:"20px", borderRadius:"0 3px 3px 0",
                      background:roleColor,
                    }} />
                  )}
                  {tab.icon}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            title="Logout"
            style={{
              width:"44px", height:"44px", borderRadius:"10px",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"transparent", color:"rgba(239,68,68,0.5)",
              transition:"all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(239,68,68,0.5)";
            }}
          >
            {Icons.logout}
          </button>
        </aside>
      )}

      {/* ── Main ── */}
      <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>

        {/* Header */}
        {showHeader && (
          <header style={{
            height:"56px", flexShrink:0,
            padding:"0 32px",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
            background:"var(--bg2)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, zIndex:10,
          }}>
            {/* Left: back + title */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              {activeTab !== "overview" && (
                <button
                  onClick={() => setActiveTab("overview")}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center",
                    width:"28px", height:"28px", borderRadius:"7px",
                    border:"1px solid rgba(255,255,255,0.08)",
                    background:"rgba(255,255,255,0.03)", cursor:"pointer",
                    color:"var(--text3)", transition:"all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "var(--text3)";
                  }}
                >
                  {Icons.chevronLeft}
                </button>
              )}
              <h1 style={{
                fontWeight:600, fontSize:"15px",
                color:"var(--text)", margin:0, letterSpacing:"-0.2px",
              }}>
                {pageTitle}
              </h1>
            </div>

            {/* Right: role badge + name */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{
                fontSize:"11px", fontWeight:600,
                padding:"3px 9px", borderRadius:"5px",
                background:`${roleColor}15`,
                color:roleColor,
                border:`1px solid ${roleColor}30`,
                textTransform:"uppercase", letterSpacing:"0.6px",
              }}>
                {roleLabel}
              </span>
              <span style={{
                fontSize:"13px", fontWeight:500, color:"var(--text2)",
              }}>
                {user?.name}
              </span>
            </div>
          </header>
        )}

        {/* Content */}
        <div style={{
          flex:1, padding: showHeader ? "28px 32px" : "0",
          overflowY:"auto",
        }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}