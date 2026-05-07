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

// Trainer components
import TrainerOverview       from "../components/trainer/TrainerOverview.jsx";
import TrainerProfileView    from "../components/trainer/TrainerProfileView.jsx";
import TrainerProgramManager from "../components/trainer/TrainerProgramManager.jsx";
import TrainerProgramBuilder from "../components/trainer/TrainerProgramBuilder.jsx";
import LiveSessionManager    from "../components/trainer/LiveSessionManager.jsx";
import VerificationStatus    from "../components/trainer/VerificationStatus.jsx";
import TrainerRecommendProducts from "../components/trainer/TrainerRecommendProducts.jsx";
import TrainerDietPlanBuilder from "../components/trainer/TrainerDietPlanBuilder.jsx";
import ClientProofFeed        from "../components/trainer/ClientProofFeed.jsx";

// Shared & Specialized
import Inbox                 from "../components/common/Inbox.jsx";
import GroupChatList         from "../components/common/GroupChatList.jsx";
import AdminDashboard        from "../components/admin/AdminDashboard.jsx";
import VendorDashboard       from "../components/Vendor/VendorDashboard.jsx";

const CLIENT_TABS = [
  { id: "overview",    icon: "📊", label: "Overview"         },
  { id: "myprograms",  icon: "📚", label: "My Programs"      },
  { id: "marketplace", icon: "🏪", label: "Browse Programs"  },
  { id: "trainers",    icon: "🔍", label: "Find Trainers"    },
  { id: "workouts",    icon: "🏋️", label: "Log Workout"      },
  { id: "proof",       icon: "📸", label: "Workout Proofs"    },
  { id: "progress",    icon: "📈", label: "Progress"         },
  { id: "groupchat",   icon: "👥", label: "Group Chats"      },
  { id: "messages",    icon: "💬", label: "Messages"         },
  { id: "dietplan",    icon: "🥗", label: "My Diet Plan"     },
  { id: "profile",     icon: "👤", label: "Profile"          },
  
];

const TRAINER_TABS = [
  { id: "overview",     icon: "📊", label: "Overview"         },
  { id: "manage",       icon: "👥", label: "Manage Programs"  },
  { id: "builder",      icon: "📋", label: "Create Program"   },
  { id: "sessions",     icon: "🎥", label: "Live Sessions"    },
  { id: "groupchat",    icon: "👥", label: "Group Chats"      },
  { id: "messages",     icon: "💬", label: "Messages"         },
  { id: "clientproof",        icon: "📸", label: "Review Queue"    },
  { id: "verification", icon: "✅", label: "Verification"     },
  { id: "dietplan",     icon: "🥗", label: "Diet Plans"       },
  { id: "recommend",    icon: "⭐", label: "Recommend Products" },
  { id: "profile",      icon: "👤", label: "My Profile"       },
  
];

// RECTIFICATION: Added dedicated Vendor tabs
const VENDOR_TABS = [
  { id: "overview", icon: "🏪", label: "Vendor Panel" },
];

const ADMIN_TABS = [
  { id: "overview", icon: "🛡️", label: "Admin Panel" },
];

export default function Dashboard() {
  const { user, token } = useAuth();
  
  // RECTIFICATION: Role-based tab selection logic
  const tabs = user?.role === "client"  ? CLIENT_TABS
             : user?.role === "trainer" ? TRAINER_TABS
             : user?.role === "vendor"  ? VENDOR_TABS
             : ADMIN_TABS;

  const [activeTab, setActiveTab] = useState("overview");

  // Register push notifications on mount
  useEffect(() => {
    if (token) registerPushNotifications(token).catch(() => {});
  }, [token]);

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const roleBadgeClass = {
    client: "badge-client", 
    trainer: "badge-trainer", 
    admin: "badge-admin", 
    vendor: "badge-trainer", // Using trainer colors for vendor theme
  }[user?.role] || "badge-client";

  const renderContent = () => {
    if (user?.role === "admin") return <AdminDashboard />;
    
    // RECTIFICATION: Render VendorDashboard only for vendor role
    if (user?.role === "vendor") return <VendorDashboard />;

    if (user?.role === "client") {
      if (activeTab === "overview")    return <ClientOverview />;
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
    }

    if (user?.role === "trainer") {
      if (activeTab === "overview")     return <TrainerOverview />;
      if (activeTab === "manage")       return <TrainerProgramManager />;
      if (activeTab === "builder")      return <TrainerProgramBuilder />;
      if (activeTab === "sessions")     return <LiveSessionManager />;
      if (activeTab === "groupchat")    return <GroupChatList />;
      if (activeTab === "messages")     return <Inbox />;
      if (activeTab === "verification") return <VerificationStatus />;
      if (activeTab === "profile")      return <TrainerProfileView />;
      if (activeTab === "recommend")    return <TrainerRecommendProducts />;
      if (activeTab === "dietplan")     return <TrainerDietPlanBuilder />;
      if (activeTab === "clientproof")  return <ClientProofFeed />;
    }

    return null;
  };

  return (
    <div className="container section">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div className="nav-avatar" style={{ width: "40px", height: "40px", fontSize: "16px", borderRadius: "12px" }}>
                {initials}
              </div>
              <div>
                <div className="sidebar-name">{user?.name}</div>
                <span className={`nav-badge ${roleBadgeClass}`}>{user?.role}</span>
              </div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="sidebar-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <div style={{ marginBottom: "8px" }}>
            <h1 className="section-title">
              {tabs.find(t => t.id === activeTab)?.label || "Dashboard"}
            </h1>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              Welcome back, {user?.name?.split(" ")[0]}.
            </p>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}