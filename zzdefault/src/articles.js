// articles.js — CRUD de artigos com Supabase

import supabase from "./supabase.js";

export async function getArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getArticleById(id) {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createArticle({ type, headline, body, coverImage, images, sources, author }) {
  const { data, error } = await supabase.from("articles").insert({
    type,
    headline,
    body,
    cover_image: coverImage,
    sources,
    author,
  }).select().single();
  if (error) return null;
  return data;
}

export async function updateArticle(id, fields) {
  const { data, error } = await supabase.from("articles").update({
    type: fields.type,
    headline: fields.headline,
    body: fields.body,
    cover_image: fields.coverImage,
    sources: fields.sources,
    author: fields.author,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) return null;
  return data;
}

export async function deleteArticle(id) {
  await supabase.from("articles").delete().eq("id", id);
}

export function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dia(s)`;
  return new Date(isoString).toLocaleDateString("pt-BR");
}