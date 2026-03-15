// articles.js — CRUD de artigos com localStorage

export function getArticles() {
  return JSON.parse(localStorage.getItem("fannon_articles") || "[]");
}

function saveArticles(articles) {
  localStorage.setItem("fannon_articles", JSON.stringify(articles));
}

export function createArticle({ type, headline, body, images, coverImage, sources, author }) {
  const articles = getArticles();
  const id = Date.now().toString();
  const article = {
    id,
    type,
    headline,
    body,
    images,       // array de { url, caption }
    coverImage,   // url string
    sources,      // array de { label, url }
    author,       // { name, username }
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.unshift(article);
  saveArticles(articles);
  return article;
}

export function updateArticle(id, fields) {
  const articles = getArticles();
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  articles[idx] = { ...articles[idx], ...fields, updatedAt: new Date().toISOString() };
  saveArticles(articles);
  return articles[idx];
}

export function deleteArticle(id) {
  const articles = getArticles().filter((a) => a.id !== id);
  saveArticles(articles);
}

export function getArticleById(id) {
  return getArticles().find((a) => a.id === id) || null;
}

export function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dia(s)`;
  return new Date(isoString).toLocaleDateString("pt-BR");
}