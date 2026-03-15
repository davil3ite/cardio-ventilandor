import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import { getSession, logout } from "../auth.js";
import { getArticles, timeAgo } from "../articles.js";
import "./css/hub.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const session = getSession();
  const articles = getArticles();

  function handleLogout() {
    logout();
    navigate('/');
    window.location.reload();
  }

  function toggleTheme() {
    setDarkMode(v => {
      const next = !v;
      localStorage.setItem("fannon_theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <div className={darkMode ? "theme-dark" : "theme-light"}>
      <header className="header">
        <div className="header-left">
          <button
            className={`menu-btn ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span/><span/><span/>
          </button>
        </div>

        <div className="header-center">
          <button className="btn-logo" disabled="true">
            <img src="/logofannonmetalic.png" style={{ height: "65px", width: "auto" }} />
          </button>
        </div>

        <div className="header-right">
          {session ? (
            <>
              <span className="header-username">{session.name}</span>
              {session.type === "adm" && (
                <button className="btn-write" onClick={() => navigate('/write')}>Escrever</button>
              )}
              <button className="btn-login" onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
              <button className="btn-signup" onClick={() => navigate('/signup')}>Sign up</button>
            </>
          )}
        </div>
      </header>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button className="sidebar-home" onClick={() => navigate('/')}>Início</button>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-logsign">
            {session ? (
              <button className="sb-login" onClick={handleLogout}>Sair</button>
            ) : (
              <>
                <button className="sb-login" onClick={() => navigate('/login')}>Login</button>
                <button className="sb-signup" onClick={() => navigate('/signup')}>Sign up</button>
              </>
            )}
          </div>
          <div className="theme-div">
            <span className="theme-label">{darkMode ? "Escuro" : "Claro"}</span>
            <button
              className={`theme-switch ${darkMode ? "on" : ""}`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            />
          </div>
        </div>
      </aside>

      <main className="page-content">
        {articles.length === 0 ? (
          <p className="page-hint">Nenhuma matéria publicada ainda.</p>
        ) : (
          <div className="articles-grid">
            {articles.map((a) => (
              <div className="article-card" key={a.id} onClick={() => navigate(`/article/${a.id}`)}>
                {a.coverImage && (
                  <div className="card-cover" style={{ backgroundImage: `url(${a.coverImage})` }} />
                )}
                <div className="card-body">
                  <span className="card-type">{a.type}</span>
                  <h2 className="card-headline">{a.headline}</h2>
                  <p className="card-excerpt">{a.body.replace(/<[^>]+>/g, '').slice(0, 120)}...</p>
                  <div className="card-meta">
                    <span>{a.author.name}</span>
                    <span>{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Layout