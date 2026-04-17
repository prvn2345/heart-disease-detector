import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, LayoutDashboard, ClipboardList, LogOut, Activity, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <Heart className="text-primary-500" size={24} fill="currentColor" />
            <span>Heart<span className="text-primary-400">Detect</span></span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavLink to="/"        className={navLinkClass} end>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink to="/predict" className={navLinkClass}>
              <Activity size={16} /> Predict
            </NavLink>
            <NavLink to="/samples" className={navLinkClass}>
              <FlaskConical size={16} /> Samples
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              <ClipboardList size={16} /> History
            </NavLink>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white
                         hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
              aria-label="Log out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
