import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSession } from "../auth.js";
import { getArticleById, deleteArticle, getComments, addComment, deleteComment, timeAgo } from "../articles.js";
import "./css/article.css";

const INSTAGRAM_URL = "https://www.instagram.com/folha.alfa_news/";
const CONTACT_EMAIL = "folhaalfanews@gmail.com";

function Article() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getArticleById(id).then(data => { setArticle(data); setLoading(false); });
    getComments(id).then(setComments);
  }, [id]);

  function toggleTheme() {
    setDarkMode(v => { const next = !v; localStorage.setItem("fannon_theme", next ? "dark" : "light"); return next; });
  }

  if (loading) return <div className="theme-dark" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}><p style={{ color: "#555", fontFamily: "Syne, sans-serif" }}>Carregando...</p></div>;
  if (!article) return <div className="theme-dark" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}><p style={{ color: "#555", fontFamily: "Syne, sans-serif" }}>Matéria não encontrada.</p></div>;

  const canEdit = session && (
    session.username === article.author.username || session.type === "adm+"
  );

  async function handleDelete() {
    if (window.confirm("Tem certeza que quer deletar esta matéria?")) { await deleteArticle(id); navigate("/"); }
  }

  async function handleComment() {
    if (!commentText.trim() || !session) return;
    setPosting(true);
    const comment = await addComment({
      articleId: id,
      author: { name: session.name, username: session.username, avatar: session.avatar || "" },
      content: commentText.trim(),
    });
    if (comment) {
      setComments(prev => [...prev, comment]);
      setCommentText("");
    }
    setPosting(false);
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
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
            {article.author.avatar ? <img src={article.author.avatar} className="article-avatar" alt="avatar" /> : <div className="article-avatar-placeholder">{article.author.name[0].toUpperCase()}</div>}
            <span className="article-author">{article.author.name}</span>
          </div>
          {article.cover_image && <img src={article.cover_image} alt="capa" className="article-cover" />}
          <div className="article-text" dangerouslySetInnerHTML={{ __html: article.body }} />

          {article.sources && article.sources.filter(s => s.url).length > 0 && (
            <div className="sources-dropdown">
              <button className="sources-toggle" onClick={() => setSourcesOpen(v => !v)}>Fontes {sourcesOpen ? "▲" : "▼"}</button>
              {sourcesOpen && (
                <ul className="sources-list">
                  {article.sources.filter(s => s.url).map((s, i) => (
                    <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label || s.url}</a></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {canEdit && (
            <div className="author-actions">
              <button className="btn-edit" onClick={() => navigate(`/write/${id}`)}>Editar</button>
              <button className="btn-delete" onClick={handleDelete}>Deletar</button>
            </div>
          )}

          {/* Comentários */}
          {article.allow_comments !== false && (
            <div className="comments-section">
              <h3 className="comments-title">Comentários ({comments.length})</h3>

              {session ? (
                <div className="comment-input-row">
                  {session.avatar ? <img src={session.avatar} className="comment-avatar" alt="avatar" /> : <div className="comment-avatar-placeholder">{session.name[0].toUpperCase()}</div>}
                  <div className="comment-input-wrap">
                    <textarea
                      className="comment-input"
                      placeholder="Escreva um comentário..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={2}
                    />
                    <button className="comment-submit" onClick={handleComment} disabled={posting || !commentText.trim()}>
                      {posting ? "Enviando..." : "Comentar"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-login-hint">
                  <span onClick={() => navigate("/login")}>Faça login</span> para comentar.
                </p>
              )}

              <div className="comments-list">
                {comments.length === 0 && <p className="no-comments">Nenhum comentário ainda. Seja o primeiro!</p>}
                {comments.map(c => (
                  <div className="comment" key={c.id}>
                    <div className="comment-header">
                      {c.author.avatar ? <img src={c.author.avatar} className="comment-avatar" alt="avatar" /> : <div className="comment-avatar-placeholder">{c.author.name[0].toUpperCase()}</div>}
                      <div className="comment-meta">
                        <span className="comment-name">{c.author.name}</span>
                        <span className="comment-time">{timeAgo(c.created_at)}</span>
                      </div>
                      {session?.type === "adm" || session?.type === "adm+" ? (
                        <button className="comment-delete" onClick={() => handleDeleteComment(c.id)} title="Apagar comentário">✕</button>
                      ) : null}
                    </div>
                    <p className="comment-content">{c.content}</p>
                  </div>
                ))}
              </div>
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
        <span className="footer-dot">•</span>
        <span className="footer-text">{CONTACT_EMAIL}</span>
      </footer>
    </div>
  );
}

export default Article;