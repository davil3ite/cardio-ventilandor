import { useState } from "react";
import "./css/login.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
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
          <img src="/logofannonmetalic.png" style={{ height: "75px", width: "auto" }} />
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

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} />

      <main className="page-content">
      </main>
    </>
  );
}

export default Layout