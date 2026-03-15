import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSession } from "../auth.js";
import { getArticleById, deleteArticle } from "../articles.js";
import "./css/article.css";

function Article() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const article = getArticleById(id);

  if (!article) {
    return (
      <div className="theme-dark" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <p style={{ color: "#555", fontFamily: "Syne, sans-serif" }}>Matéria não encontrada.</p>
      </div>
    );
  }

  const isAuthor = session && session.username === article.author.username;

  function handleDelete() {
    if (window.confirm("Tem certeza que quer deletar esta matéria?")) {
      deleteArticle(id);
      navigate("/");
    }
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
          <p className="article-author">{article.author.name}</p>
          <h1 className="article-headline">{article.headline}</h1>

          {article.coverImage && (
            <img src={article.coverImage} alt="capa" className="article-cover" />
          )}

          <div
            className="article-text"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {article.sources && article.sources.filter(s => s.url).length > 0 && (
            <div className="sources-dropdown">
              <button className="sources-toggle" onClick={() => setSourcesOpen(v => !v)}>
                Fontes {sourcesOpen ? "▲" : "▼"}
              </button>
              {sourcesOpen && (
                <ul className="sources-list">
                  {article.sources.filter(s => s.url).map((s, i) => (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label || s.url}
                      </a>
                    </li>
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
    </div>
  );
}

export default Article;