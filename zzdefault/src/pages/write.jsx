import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSession } from "../auth.js";
import { createArticle, updateArticle, getArticleById } from "../articles.js";
import "./css/write.css";

const TYPES = ["Notícia", "Reportagem", "Artigo de opinião", "Crônica"];

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function saveSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange();
}

function restoreSelection(range) {
  if (!range) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function applyTag(tag) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  let node = sel.anchorNode;
  while (node) {
    if (node.nodeName === tag.toUpperCase()) {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }
    node = node.parentNode;
  }
  const wrapper = document.createElement(tag);
  try { range.surroundContents(wrapper); }
  catch { wrapper.appendChild(range.extractContents()); range.insertNode(wrapper); }
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

function Write() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [type, setType] = useState(TYPES[0]);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [sources, setSources] = useState([{ label: "", url: "" }]);
  const [allowComments, setAllowComments] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const bodyRef = useRef(null);
  const coverInputRef = useRef(null);
  const inlineInputRef = useRef(null);
  const savedSelRef = useRef(null);

  useEffect(() => {
    if (!session || (session.type !== "adm" && session.type !== "adm+")) { navigate("/"); return; }
    if (id) {
      getArticleById(id).then(a => {
        if (a) {
          setType(a.type); setHeadline(a.headline); setBody(a.body);
          setCoverImage(a.cover_image || ""); setCoverPreview(a.cover_image || "");
          setSources(a.sources?.length ? a.sources : [{ label: "", url: "" }]);
          setAllowComments(a.allow_comments !== false);
          if (bodyRef.current) bodyRef.current.innerHTML = a.body;
        }
      });
    }
  }, []);

  function toggleTheme() {
    setDarkMode(v => { const next = !v; localStorage.setItem("fannon_theme", next ? "dark" : "light"); return next; });
  }
  function handleBodyChange() { setBody(bodyRef.current.innerHTML); }
  function handleFormat(e, tag) {
    e.preventDefault(); bodyRef.current.focus();
    if (savedSelRef.current) restoreSelection(savedSelRef.current);
    applyTag(tag); setBody(bodyRef.current.innerHTML);
  }
  function handleAlign(e, dir) {
    e.preventDefault(); bodyRef.current.focus();
    if (savedSelRef.current) restoreSelection(savedSelRef.current);
    document.execCommand("justify" + dir, false, null);
    setBody(bodyRef.current.innerHTML);
  }
  function handleEditorBlur() { savedSelRef.current = saveSelection(); }

  async function handleCoverChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await fileToBase64(file);
    setCoverImage(base64); setCoverPreview(base64);
  }
  async function handleInlineImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await fileToBase64(file);
    bodyRef.current.focus();
    if (savedSelRef.current) restoreSelection(savedSelRef.current);
    document.execCommand("insertImage", false, base64);
    setBody(bodyRef.current.innerHTML); e.target.value = "";
  }

  function addSource() { setSources(s => [...s, { label: "", url: "" }]); }
  function removeSource(i) { setSources(s => s.filter((_, idx) => idx !== i)); }
  function updateSource(i, field, value) { setSources(s => s.map((src, idx) => idx === i ? { ...src, [field]: value } : src)); }

  async function handlePublish() {
    if (!headline.trim()) { setError("A manchete é obrigatória."); return; }
    if (!body.trim() || body === "<br>") { setError("O texto é obrigatório."); return; }
    setPublishing(true);
    const data = {
      type, headline: headline.trim(), body, coverImage, images: [],
      sources: sources.filter(s => s.url.trim()),
      author: { name: session.name, username: session.username, avatar: session.avatar || "" },
      allow_comments: allowComments,
    };
    if (id) await updateArticle(id, data);
    else await createArticle(data);
    setPublishing(false);
    navigate("/");
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

      <main className="write-content">
        <div className="write-card">
          <h1 className="write-title">{id ? "Editar matéria" : "Nova matéria"}</h1>
          <div className="write-field">
            <label>Tipo</label>
            <div className="type-options">
              {TYPES.map(t => <button key={t} className={`type-btn ${type === t ? "active" : ""}`} onClick={() => setType(t)}>{t}</button>)}
            </div>
          </div>
          <div className="write-field">
            <label>Manchete</label>
            <input type="text" placeholder="Título da matéria" value={headline} onChange={e => { setHeadline(e.target.value); setError(""); }} />
          </div>
          <div className="write-field">
            <label>Imagem de capa</label>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
            <button className="file-btn" onClick={() => coverInputRef.current.click()}>
              {coverPreview ? "Trocar imagem de capa" : "Escolher imagem de capa"}
            </button>
            {coverPreview && <img src={coverPreview} alt="capa" className="cover-preview" />}
          </div>
          <div className="write-field">
            <label>Texto</label>
            <div className="editor-toolbar">
              <button onMouseDown={e => handleFormat(e, "b")}><b>B</b></button>
              <button onMouseDown={e => handleFormat(e, "i")}><i>I</i></button>
              <button onMouseDown={e => handleFormat(e, "u")}><u>U</u></button>
              <span className="toolbar-sep" />
              <button onMouseDown={e => handleAlign(e, "Left")}>⬅</button>
              <button onMouseDown={e => handleAlign(e, "Center")}>☰</button>
              <button onMouseDown={e => handleAlign(e, "Right")}>➡</button>
              <span className="toolbar-sep" />
              <button onMouseDown={e => { e.preventDefault(); inlineInputRef.current.click(); }}>🖼</button>
              <input ref={inlineInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleInlineImage} />
            </div>
            <div ref={bodyRef} className="editor-body" contentEditable suppressContentEditableWarning onInput={handleBodyChange} onBlur={handleEditorBlur} data-placeholder="Escreva sua matéria aqui..." />
          </div>
          <div className="write-field">
            <label>Fontes <span className="optional">(opcional)</span></label>
            {sources.map((src, i) => (
              <div className="source-row" key={i}>
                <input type="text" placeholder="Nome da fonte" value={src.label} onChange={e => updateSource(i, "label", e.target.value)} />
                <input type="text" placeholder="https://..." value={src.url} onChange={e => updateSource(i, "url", e.target.value)} />
                {sources.length > 1 && <button className="remove-source" onClick={() => removeSource(i)}>✕</button>}
              </div>
            ))}
            <button className="add-source" onClick={addSource}>+ Adicionar fonte</button>
          </div>

          <div className="write-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={e => setAllowComments(e.target.checked)}
                className="checkbox-input"
              />
              Permitir comentários
            </label>
          </div>

          {error && <p className="write-error">{error}</p>}
          <button className="publish-btn" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publicando..." : id ? "Salvar alterações" : "Publicar"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Write;