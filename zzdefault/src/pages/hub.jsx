import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import "./css/hub.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? "theme-dark" : "theme-light"}>
      <header className="header">
        <div className="header-left">
          <button
            className={`menu-btn ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        <div className="header-center">
          <button className="btn-logo" onClick={navigate('/')}>
            <img src="/logofannonmetalic.png" style={{ height: "65px", width: "auto" }} />
          </button>
          
        </div>

        <div className="header-right">
          <button className="btn-login">Login</button>
          <button className="btn-signup">Sign up</button>
        </div>
      </header>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-footer">
          <span className="theme-label">{darkMode ? "Escuro" : "Claro"}</span>
          <button
            className={`theme-switch ${darkMode ? "on" : ""}`}
            onClick={() => setDarkMode((v) => !v)}
            aria-label="Toggle theme"
          />
        </div>
      </aside>

      <main className="page-content">
      </main>
    </div>
  );
}

export default Layout