import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  TbLayoutDashboard,
  TbPencil,
  TbSettings,
  TbReportAnalytics,
  TbChevronLeft,
  TbChevronRight,
  TbUserCircle,
  TbLogin,
  TbLogout,
  TbApi,
  TbChartBar,
  TbFileText,
  TbMessageCircle,
  TbFolder,
  TbGitBranch,
  TbCalendarStats,
} from "react-icons/tb";
import { trackEvent } from "../utils/analytics";

const icons = {
  dashboard: <TbLayoutDashboard />,
  blog: <TbPencil />,
  analytics: <TbReportAnalytics />,
  settings: <TbSettings />,
  account: <TbUserCircle />,
};

const NavItem = ({ icon, label, to, isActive, onClick }) => (
  <button
    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    <span className="nav-icon">{icon}</span>
    <span className="nav-text">{label}</span>
  </button>
);

const NavSection = ({ title, children }) => (
  <div className="nav-section">
    <h3 className="nav-section-title">{title}</h3>
    {children}
  </div>
);

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, handleLogout, signInWithGoogle } = useAuth();
  console.log("user is admin", user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const handleNav = (path, state, label) => {
    if (label) {
      trackEvent('navigation_click', 'sidebar', label, 1);
    }
    navigate(path, { state });
    setMenuOpen(false);
  };

  const handleLogoutClick = () => {
    trackEvent('logout_click', 'authentication', 'sidebar', 1);
    handleLogout();
  };

  const handleInviteClick = () => {
    trackEvent('invite_click', 'engagement', 'sidebar_team', 1);
    // Add invite functionality here
  };

  const handleProfileClick = () => {
    if (user) {
      trackEvent('profile_menu_toggle', 'navigation', 'sidebar', isMenuOpen ? 0 : 1);
      setMenuOpen(!isMenuOpen);
    } else {
      trackEvent('signin_click', 'authentication', 'sidebar', 1);
      signInWithGoogle();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef, profileRef]);

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header" style={{ border: "none" }}>
        <img
          src="/logo.svg"
          alt="OutBlog Logo"
          className="h-8 w-auto invert"
          onClick={() => handleNav("/", null, "logo_home")}
          style={{ cursor: "pointer" }}
        />
        <button className="collapse-btn" onClick={toggleSidebar}>
          {isCollapsed ? <TbChevronRight /> : <TbChevronLeft />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <NavSection title="Workspace">
          <NavItem
            icon={<TbLayoutDashboard />}
            label="Dashboard"
            isActive={location.pathname === "/dashboard"}
            onClick={() => handleNav("/dashboard", null, "dashboard")}
          />
          <NavItem
            icon={<TbPencil />}
            label="Blog"
            isActive={location.pathname.startsWith("/blogs")}
            onClick={() => handleNav("/blogs", null, "blog")}
          />
          <NavItem
            icon={<TbMessageCircle />}
            label="Prompts"
            isActive={location.pathname === "/prompts"}
            onClick={() => handleNav("/prompts", null, "prompts")}
          />
          <NavItem
            icon={<TbFolder />}
            label="Projects"
            isActive={location.pathname === "/projects"}
            onClick={() => handleNav("/projects", null, "projects")}
          />
          <NavItem
            icon={<TbGitBranch />}
            label="Workflows"
            isActive={location.pathname.startsWith("/workflows")}
            onClick={() => handleNav("/workflows", null, "workflows")}
          />
          {user?.is_admin && (
            <NavItem
              icon={<TbFileText />}
              label="Templates"
              isActive={location.pathname.startsWith("/templates")}
              onClick={() => handleNav("/templates", null, "templates")}
            />
          )}
          <NavItem
            icon={<TbMessageCircle />}
            label="CTA"
            isActive={location.pathname === "/cta-generator"}
            onClick={() => handleNav("/cta-generator", null, "cta")}
          />
        </NavSection>
        <NavSection title="General">
          <NavItem
            icon={<TbSettings />}
            label="Settings"
            isActive={location.pathname === "/settings"}
            onClick={() => handleNav("/settings", null, "settings")}
          />
        </NavSection>
      </nav>
      <div className="sidebar-bottom">
        {isMenuOpen && user && (
          <div className="profile-menu" ref={menuRef}>
            <div className="profile-menu-header">
              <div className="user-avatar">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.svg";
                    }}
                  />
                ) : (
                  user.first_name?.charAt(0) || "U"
                )}
              </div>
              <div className="profile-menu-info">
                <span className="user-name">{user.first_name || "User"}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <div className="profile-menu-section">
              <button
                className="profile-menu-btn"
                onClick={() =>
                  handleNav("/settings", { initialTab: "profile" }, "profile_settings")
                }
              >
                <TbUserCircle />
                <span>Profile</span>
              </button>

              <button
                className="profile-menu-btn"
                onClick={() =>
                  handleNav("/settings", { initialTab: "api-key" }, "api_keys")
                }
              >
                <TbApi />
                <span>API Keys</span>
              </button>
            </div>
            <div className="profile-menu-section support">
              <button className="profile-menu-btn">
                <TbSettings />
                <span>Support</span>
              </button>
            </div>
            <div className="profile-menu-section">
              <button className="profile-menu-btn" onClick={handleLogoutClick}>
                <TbLogout />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
        <div className="invite-box">
          <h4>Invite your team</h4>
          <p>Get everyone on board.</p>
          <button className="share-link-btn" onClick={handleInviteClick}>Share Link</button>
        </div>
        <div
          className="user-profile"
          ref={profileRef}
          onClick={handleProfileClick}
        >
          {user ? (
            <div className="user-info">
              <div className="user-avatar">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.svg";
                    }}
                  />
                ) : (
                  user.first_name?.charAt(0) || "U"
                )}
              </div>
              <span className="user-name">{user.first_name || "User"}</span>
            </div>
          ) : (
            <div className="user-info">
              <div className="user-avatar">
                {" "}
                <TbLogin size="1.2em" />{" "}
              </div>
              <span className="user-name">Sign In</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
