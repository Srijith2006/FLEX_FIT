import Marketplace from "../components/client/Marketplace.jsx";
import useAuth from "../hooks/useAuth.js";
import { Link } from "react-router-dom";

export default function MarketplacePage() {
  const { user } = useAuth();

  return (
    <div style={{ background:"var(--bg)", minHeight:"calc(100vh - 68px)" }}>
      {/* Hero banner */}
      <div style={{
        background:"linear-gradient(135deg,rgba(0,112,243,0.08),rgba(124,58,237,0.06))",
        borderBottom:"1px solid var(--border)", padding:"32px 0 24px",
      }}>
        <div className="container">
          <div className="flex-between" style={{ flexWrap:"wrap", gap:"16px" }}>
            <div>
              <h1 className="font-heading" style={{ fontSize:"clamp(32px,5vw,52px)", letterSpacing:"2px", marginBottom:"6px" }}>
                FLEXFIT MARKETPLACE
              </h1>
              <p style={{ color:"var(--text2)", fontSize:"15px" }}>
                Supplements · Fresh Meals · Equipment · Apparel — delivered to your door
              </p>
            </div>
            {!user && (
              <div style={{ display:"flex", gap:"10px" }}>
                <Link to="/login"    className="btn btn-outline">Login to Order</Link>
                <Link to="/register" className="btn btn-accent">Sign Up Free</Link>
              </div>
            )}
          </div>

          {/* Value props */}
          <div style={{ display:"flex", gap:"24px", marginTop:"20px", flexWrap:"wrap" }}>
            {[
              { icon:"🚚", text:"Free delivery on orders ₹999+" },
              { icon:"✅", text:"Verified vendors only"          },
              { icon:"🔒", text:"Secure Razorpay checkout"       },
              { icon:"👥", text:"Group deals — buy with friends"  },
            ].map(v => (
              <div key={v.text} style={{ display:"flex", gap:"6px", alignItems:"center", fontSize:"13px", color:"var(--text2)" }}>
                <span>{v.icon}</span><span>{v.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container section" style={{ paddingTop:"24px" }}>
        {user ? (
          <Marketplace />
        ) : (
          /* Guest view — show products but prompt to login to order */
          <GuestMarketplace />
        )}
      </div>
    </div>
  );
}

function GuestMarketplace() {
  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom:"16px" }}>
        🛒 <strong>Login or sign up</strong> to place orders and see your trainer's recommendations.
      </div>
      <Marketplace />
    </div>
  );
}