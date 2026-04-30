import { useState } from "react";
import useAuth from "../hooks/useAuth.js";
import ClientOverview from "../components/client/ClientOverview.jsx";
import TrainerBrowse from "../components/client/TrainerBrowse.jsx";
import WorkoutLogger from "../components/client/WorkoutLogger.jsx";
import ProgressTracker from "../components/client/ProgressTracker.jsx";
import ClientProfile from "../components/client/ClientProfile.jsx";
import ProgramMarketplace from "../components/client/ProgramMarketplace.jsx";
import MyRegisteredPrograms from "../components/client/MyRegisteredPrograms.jsx";
import Inbox from "../components/common/Inbox.jsx";
import TrainerDashboard from "../components/trainer/TrainerDashboard.jsx";
import VerificationUpload from "../components/trainer/VerificationUpload.jsx";
import TrainerProgramBuilder from "../components/trainer/TrainerProgramBuilder.jsx";
import TrainerProgramManager from "../components/trainer/TrainerProgramManager.jsx";
import LiveSessionManager from "../components/trainer/LiveSessionManager.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";

const CLIENT_TABS = [
  { id: "overview",    icon: "📊", label: "Overview"          },
  { id: "myprograms",  icon: "📚", label: "My Programs"       },
  { id: "marketplace", icon: "🏪", label: "Browse Programs"   },
  { id: "trainers",    icon: "🔍", label: "Find Trainers"     },
  { id: "workouts",    icon: "🏋️", label: "Log Workout"      },
  { id: "progress",    icon: "📈", label: "Progress"          },
  { id: "messages",    icon: "💬", label: "Messages"          },
  { id: "profile",     icon: "👤", label: "Profile"           },
];

const TRAINER_TABS = [
  { id: "overview",     icon: "📊", label: "Overview"         },
  { id: "manage",       icon: "👥", label: "Manage Programs"  },
  { id: "builder",      icon: "📋", label: "Create Program"   },
  { id: "sessions",     icon: "🎥", label: "Live Sessions"    },
  { id: "verification", icon: "✅", label: "Verification"     },
  { id: "messages",     icon: "💬", label: "Messages"         },
  { id: "profile",      icon: "👤", label: "My Profile"       },
];

const ADMIN_TABS = [
  { id: "overview", icon: "🛡️", label: "Admin Panel" },
];

function StatsRow({ user }) {
  const cards = user.role === "client"
    ? [
        { icon: "🔥", label: "Current Streak",  value: "5",   unit: "days",       color: "var(--accent)" },
        { icon: "⚖️", label: "Workouts Logged", value: "24",  unit: "total",      color: "var(--green)"  },
        { icon: "📚", label: "My Programs",     value: "—",   unit: "enroll now", color: "var(--gold)"   },
      ]
    : [
        { icon: "👥", label: "Total Clients",  value: "8",    unit: "active",     color: "var(--accent)" },
        { icon: "⭐", label: "Avg Rating",     value: "4.8",  unit: "stars",      color: "var(--gold)"   },
        { icon: "💰", label: "This Month",     value: "$640", unit: "earned",     color: "var(--green)"  },
      ];

  return (
    <div className="grid-3">
      {cards.map(c => (
        <div key={c.label} className="stat-card">
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>{c.icon}</div>
          <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
          <div className="stat-card-label">{c.unit} · {c.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const tabs = user?.role === "client" ? CLIENT_TABS
             : user?.role === "trainer" ? TRAINER_TABS
             : ADMIN_TABS;
  const [activeTab, setActiveTab] = useState("overview");

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const roleBadgeClass = {
    client: "badge-client", trainer: "badge-trainer", admin: "badge-admin",
  }[user?.role] || "badge-client";

  const renderContent = () => {
    if (user?.role === "admin") return <AdminDashboard />;

    if (user?.role === "client") {
      if (activeTab === "overview")    return <ClientOverview />;
      if (activeTab === "myprograms")  return <MyRegisteredPrograms />;
      if (activeTab === "marketplace") return <ProgramMarketplace />;
      if (activeTab === "trainers")    return <TrainerBrowse />;
      if (activeTab === "workouts")    return <WorkoutLogger />;
      if (activeTab === "progress")    return <ProgressTracker />;
      if (activeTab === "messages")    return <Inbox />;
      if (activeTab === "profile")     return <ClientProfile />;
    }

    if (user?.role === "trainer") {
      if (activeTab === "overview")     return <><StatsRow user={user} /><TrainerDashboard /></>;
      if (activeTab === "manage")       return <TrainerProgramManager />;
      if (activeTab === "builder")      return <TrainerProgramBuilder />;
      if (activeTab === "sessions")     return <LiveSessionManager />;
      if (activeTab === "verification") return <VerificationUpload />;
      if (activeTab === "messages")     return <Inbox />;
      if (activeTab === "profile")      return <TrainerDashboard />;
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
