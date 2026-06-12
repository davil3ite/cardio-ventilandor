// write.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSession } from "../auth.js";
import { createArticle, updateArticle, getArticleById, getEditions, createEdition, deleteEdition } from "../articles.js";
import "./css/write.css";

const TYPES = ["Notícia", "Reportagem", "Artigo de opinião", "Crônica"];
const THEMES = ["Esportes", "Cultura", "Escola", "Mundo", "Ciência", "Tecnologia", "Saúde", "Arte"];
const THEMES_VISIBLE = 6;

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function applyFormat(tag) {
  const sel = window.getSelection();

  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    const commands = { b: "bold", i: "italic", u: "underline" };
    if (commands[tag]) document.execCommand(commands[tag], false, null);
    return;
  }

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
  try {
    range.surroundContents(wrapper);
  } catch {
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
  }
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

function Write() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();

  const [type, setType] = useState(TYPES[0]);
  const [theme, setTheme] = useState(null);
  const [themeOverflowOpen, setThemeOverflowOpen] = useState(false);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [sources, setSources] = useState([{ label: "", url: "" }]);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ b: false, i: false, u: false });

  // Edições
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [editionDropdownOpen, setEditionDropdownOpen] = useState(false);
  const [editionLoading, setEditionLoading] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);

  const bodyRef = useRef(null);
  const coverInputRef = useRef(null);
  const inlineInputRef = useRef(null);
  const editionDropdownRef = useRef(null);
  const themeOverflowRef = useRef(null);

  useEffect(() => {
    if (!session || (session.type !== "adm" && session.type !== "adm+")) { navigate("/"); return; }
    getEditions().then(eds => {
      setEditions(eds);
      if (eds.length > 0 && !id) setSelectedEdition(eds[0]);
    });
    if (id) {
      getArticleById(id).then(a => {
        if (a) {
          setType(a.type);
          setTheme(a.theme || null);
          setHeadline(a.headline);
          setBody(a.body);
          setCoverImage(a.cover_image || "");
          setCoverPreview(a.cover_image || "");
          setSources(a.sources?.length ? a.sources : [{ label: "", url: "" }]);
          if (bodyRef.current) bodyRef.current.innerHTML = a.body;
          if (a.edition_id) {
            getEditions().then(eds => {
              const ed = eds.find(e => e.id === a.edition_id);
              if (ed) setSelectedEdition(ed);
            });
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (editionDropdownRef.current && !editionDropdownRef.current.contains(e.target))
        setEditionDropdownOpen(false);
      if (themeOverflowRef.current && !themeOverflowRef.current.contains(e.target))
        setThemeOverflowOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreateEdition() {
    setEditionLoading(true);
    const ed = await createEdition();
    if (ed) {
      const updated = await getEditions();
      setEditions(updated);
      setSelectedEdition(ed);
    }
    setEditionLoading(false);
    setEditionDropdownOpen(false);
  }

  async function handleDeleteEdition(e, edId) {
    e.stopPropagation();
    if (deleteWarning === edId) {
      const result = await deleteEdition(edId);
      if (result.ok) {
        const updated = await getEditions();
        setEditions(updated);
        if (selectedEdition?.id === edId)
          setSelectedEdition(updated.length > 0 ? updated[0] : null);
      }
      setDeleteWarning(null);
    } else {
      setDeleteWarning(edId);
    }
    setTimeout(() => setDeleteWarning(v => v === edId ? null : v), 3000);
  }

  function handleBodyChange() { setBody(bodyRef.current.innerHTML); }

  function updateActiveFormats() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Quando o cursor está parado (sem texto selecionado), o estado "real" de
    // formatação para o próximo caractere digitado é dado por queryCommandState,
    // que já reflete eventuais toggles feitos via execCommand antes de o DOM mudar.
    // Usar a checagem de ancestrais aqui causava o botão "preso" no estado anterior
    // até o usuário digitar algo.
    if (sel.isCollapsed) {
      setActiveFormats({
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
      });
      return;
    }

    // Quando há um trecho selecionado, a checagem de ancestrais reflete melhor
    // a formatação efetivamente aplicada (inclusive a aplicada manualmente via
    // surroundContents/unwrap em applyFormat).
    let node = sel.anchorNode;
    const active = { b: false, i: false, u: false };
    while (node && node !== bodyRef.current) {
      const name = node.nodeName?.toLowerCase();
      if (name === "b" || name === "strong") active.b = true;
      if (name === "i" || name === "em") active.i = true;
      if (name === "u") active.u = true;
      node = node.parentNode;
    }
    setActiveFormats(active);
  }

  function handleFormat(e, tag) {
    e.preventDefault();
    bodyRef.current.focus();
    applyFormat(tag);
    setBody(bodyRef.current.innerHTML);
    setTimeout(updateActiveFormats, 0);
  }

  function handleAlign(e, dir) {
    e.preventDefault();
    bodyRef.current.focus();
    document.execCommand("justify" + dir, false, null);
    setBody(bodyRef.current.innerHTML);
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    setBody(bodyRef.current.innerHTML);
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await fileToBase64(file);
    setCoverImage(base64); setCoverPreview(base64);
  }

  async function handleInlineImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await fileToBase64(file);
    bodyRef.current.focus();
    document.execCommand("insertImage", false, base64);
    setBody(bodyRef.current.innerHTML);
    e.target.value = "";
  }

  function addSource() { setSources(s => [...s, { label: "", url: "" }]); }
  function removeSource(i) { setSources(s => s.filter((_, idx) => idx !== i)); }
  function updateSource(i, field, value) { setSources(s => s.map((src, idx) => idx === i ? { ...src, [field]: value } : src)); }

  async function handlePublish() {
    if (!headline.trim()) { setError("A manchete é obrigatória."); return; }
    if (!body.trim() || body === "<br>") { setError("O texto é obrigatório."); return; }
    setPublishing(true);
    const data = {
      type,
      theme,
      headline: headline.trim(),
      body,
      coverImage,
      images: [],
      sources: sources.filter(s => s.url.trim()),
      author: { name: session.name, username: session.username, avatar: session.avatar || "" },
      editionId: selectedEdition?.id || null,
    };
    if (id) await updateArticle(id, data);
    else await createArticle(data);
    setPublishing(false);
    navigate("/");
  }

  const visibleThemes = THEMES.slice(0, THEMES_VISIBLE);
  const overflowThemes = THEMES.slice(THEMES_VISIBLE);
  const isOverflowTheme = theme && overflowThemes.includes(theme);

  return (
    <div>
      <header className="header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate("/")}>◀</button>
        </div>
        <div className="header-center">
          <button className="btn-logo" onClick={() => navigate("/")}>
            <img src="/logofanNEOsite.png" style={{ height: "65px", width: "auto" }} />
          </button>
        </div>
        <div className="header-right" />
      </header>

      <main className="write-content">
        <div className="write-card">

          {/* Título + dropdown de edição */}
          <div className="write-title-row">
            <h1 className="write-title">{id ? "Editar matéria" : "Nova matéria"}</h1>

            {editions.length > 0 || session?.type === "adm+" ? (
              <div className="edition-dropdown-wrap" ref={editionDropdownRef}>
                <button
                  className="edition-pill"
                  onClick={() => setEditionDropdownOpen(v => !v)}
                >
                  {selectedEdition ? `Edição ${selectedEdition.number}` : "Sem edição"}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4 }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {editionDropdownOpen && (
                  <div className="edition-dropdown">
                    {editions.map(ed => (
                      <div
                        key={ed.id}
                        className={`edition-option ${selectedEdition?.id === ed.id ? "active" : ""}`}
                        onClick={() => { setSelectedEdition(ed); setEditionDropdownOpen(false); setDeleteWarning(null); }}
                      >
                        <span>Edição {ed.number}</span>
                        {session?.type === "adm+" && (
                          <button
                            className={`edition-delete-btn ${deleteWarning === ed.id ? "warn" : ""}`}
                            onClick={e => handleDeleteEdition(e, ed.id)}
                            title={deleteWarning === ed.id ? "Clique novamente para confirmar" : "Apagar edição"}
                          >
                            {deleteWarning === ed.id ? "!" : "×"}
                          </button>
                        )}
                      </div>
                    ))}

                    {deleteWarning && (
                      <p className="edition-delete-warn">
                        Apague todas as matérias desta edição antes de removê-la.
                      </p>
                    )}

                    {session?.type === "adm+" && (
                      <button
                        className="edition-create-btn"
                        onClick={handleCreateEdition}
                        disabled={editionLoading}
                      >
                        {editionLoading ? "Criando..." : "+ Nova edição"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Tipo */}
          <div className="write-field">
            <label>Tipo</label>
            <div className="type-options">
              {TYPES.map(t => (
                <button key={t} className={`type-btn ${type === t ? "active" : ""}`} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>
          </div>

          {/* Tema */}
          <div className="write-field">
            <label>Tema <span className="optional">(opcional)</span></label>
            <div className="type-options" style={{ position: "relative" }}>
              {visibleThemes.map(t => (
                <button
                  key={t}
                  className={`type-btn ${theme === t ? "active" : ""}`}
                  onClick={() => setTheme(theme === t ? null : t)}
                >{t}</button>
              ))}

              {overflowThemes.length > 0 && (
                <div className="theme-overflow-wrap" ref={themeOverflowRef}>
                  <button
                    className={`type-btn theme-overflow-trigger ${isOverflowTheme ? "active" : ""}`}
                    onClick={() => setThemeOverflowOpen(v => !v)}
                    title="Mais temas"
                  >
                    {isOverflowTheme ? theme : "···"}
                  </button>
                  {themeOverflowOpen && (
                    <div className="theme-overflow-dropdown">
                      {overflowThemes.map(t => (
                        <button
                          key={t}
                          className={`theme-overflow-item ${theme === t ? "active" : ""}`}
                          onClick={() => { setTheme(theme === t ? null : t); setThemeOverflowOpen(false); }}
                        >{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Manchete */}
          <div className="write-field">
            <label>Manchete</label>
            <input type="text" placeholder="Título da matéria" value={headline} onChange={e => { setHeadline(e.target.value); setError(""); }} />
          </div>

          {/* Imagem de capa */}
          <div className="write-field">
            <label>Imagem de capa</label>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
            <button className="file-btn" onClick={() => coverInputRef.current.click()}>
              {coverPreview ? "Trocar imagem de capa" : "Escolher imagem de capa"}
            </button>
            {coverPreview && <img src={coverPreview} alt="capa" className="cover-preview" />}
          </div>

          {/* Texto */}
          <div className="write-field">
            <label>Texto</label>
            <div className="editor-toolbar">
              <button
                className={activeFormats.b ? "active" : ""}
                onMouseDown={e => handleFormat(e, "b")}
              ><b>B</b></button>
              <button
                className={activeFormats.i ? "active" : ""}
                onMouseDown={e => handleFormat(e, "i")}
              ><i>I</i></button>
              <button
                className={activeFormats.u ? "active" : ""}
                onMouseDown={e => handleFormat(e, "u")}
              ><u>U</u></button>
              <span className="toolbar-sep" />
              <button onMouseDown={e => handleAlign(e, "Left")}>⬅</button>
              <button onMouseDown={e => handleAlign(e, "Center")}>☰</button>
              <button onMouseDown={e => handleAlign(e, "Right")}>➡</button>
              <span className="toolbar-sep" />
              <button onMouseDown={e => { e.preventDefault(); inlineInputRef.current.click(); }}>🖼</button>
              <input ref={inlineInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleInlineImage} />
            </div>
            <div
              ref={bodyRef}
              className="editor-body"
              contentEditable
              suppressContentEditableWarning
              onInput={handleBodyChange}
              onPaste={handlePaste}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              data-placeholder="Escreva sua matéria aqui..."
            />
          </div>

          {/* Fontes */}
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