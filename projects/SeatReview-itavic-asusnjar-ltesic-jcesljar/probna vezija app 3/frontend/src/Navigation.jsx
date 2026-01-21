import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

function Navigation() {
  const { user, logout } = useAuth();
  const { language, switchLanguage } = useLanguage();
  const t = translations[language];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            🎫 {t.appTitle}
          </Link>
        </div>

        {/* Right side - Language & User */}
        <div className="navbar-menu">
          {/* Language Switcher */}
          <div className="language-switcher">
            <button
              className={`lang-btn ${language === "hr" ? "active" : ""}`}
              onClick={() => switchLanguage("hr")}
              title="Hrvatski"
            >
              🇭🇷 HR
            </button>
            <button
              className={`lang-btn ${language === "en" ? "active" : ""}`}
              onClick={() => switchLanguage("en")}
              title="English"
            >
              🇬🇧 EN
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="navbar-user">
              {user.isAdmin && (
                <Link to="/admin" className="navbar-admin">
                  ⚙️ Admin
                </Link>
              )}
              <Link to="/profile" className="navbar-profile">
                <span className="user-icon">👤</span>
                <span className="user-email">{user.email?.split("@")[0]}</span>
                {user.isAdmin && <span className="admin-star">⭐</span>}
              </Link>
              <button className="navbar-logout" onClick={logout}>
                🚪 {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
