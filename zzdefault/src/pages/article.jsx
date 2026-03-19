import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSession } from "../auth.js";
import { getArticleById, deleteArticle } from "../articles.js";
import "./css/article.css";

const INSTAGRAM_URL = "https://instagram.com/";
const CONTACT_EMAIL = "johndoe@gmail.com";

function Article() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleById(id).then(data => { setArticle(data); setLoading(false); });
  }, [id]);

  function toggleTheme() {
    setDarkMode(v => {
      const next = !v;
      localStorage.setItem("fannon_theme", next ? "dark" : "light");
      return next;
    });
  }

  if (loading) return (
    <div className="theme-dark" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <p style={{ color: "#555", fontFamily: "Syne, sans-serif" }}>Carregando...</p>
    </div>
  );

  if (!article) return (
    <div className="theme-dark" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <p style={{ color: "#555", fontFamily: "Syne, sans-serif" }}>Matéria não encontrada.</p>
    </div>
  );

  const isAuthor = session && session.username === article.author.username;

  async function handleDelete() {
    if (window.confirm("Tem certeza que quer deletar esta matéria?")) {
      await deleteArticle(id);
      navigate("/");
    }
  }

  return (
    <div className={darkMode ? "theme-dark" : "theme-light"}>
      <header className="header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate("/")}>← Voltar</button>
        </div>
        <div className="header-center">
          <button className="btn-logo" onClick={() => navigate("/")}>
            <img src="/logofannonmetalic.png" style={{ height: "65px", width: "auto" }} />
          </button>
        </div>
        <div className="header-right">
          <span className="theme-label">{darkMode ? "Escuro" : "Claro"}</span>
          <button className={`theme-switch ${darkMode ? "on" : ""}`} onClick={toggleTheme} />
        </div>
      </header>

      <main className="article-content">
        <div className="article-body">
          <span className="article-type">{article.type}</span>
          <h1 className="article-headline">{article.headline}</h1>
          <div className="article-author-row">
            {article.author.avatar
              ? <img src={article.author.avatar} className="article-avatar" alt="avatar" />
              : <div className="article-avatar-placeholder">{article.author.name[0].toUpperCase()}</div>
            }
            <span className="article-author">{article.author.name}</span>
          </div>
          {article.cover_image && <img src={article.cover_image} alt="capa" className="article-cover" />}
          <div className="article-text" dangerouslySetInnerHTML={{ __html: article.body }} />
          {article.sources && article.sources.filter(s => s.url).length > 0 && (
            <div className="sources-dropdown">
              <button className="sources-toggle" onClick={() => setSourcesOpen(v => !v)}>
                Fontes {sourcesOpen ? "▲" : "▼"}
              </button>
              {sourcesOpen && (
                <ul className="sources-list">
                  {article.sources.filter(s => s.url).map((s, i) => (
                    <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label || s.url}</a></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {isAuthor && (
            <div className="author-actions">
              <button className="btn-edit" onClick={() => navigate(`/write/${id}`)}>Editar</button>
              <button className="btn-delete" onClick={handleDelete}>Deletar</button>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="footer-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
          <span>Siga-nos no Instagram</span>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <polyline points="2,4 12,13 22,4"/>
          </svg>
          <span>Contate-nos</span>
        </a>
      </footer>
    </div>
  );
}

export default Article;