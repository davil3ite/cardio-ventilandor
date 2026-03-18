// auth.js — autenticação com Web Crypto API (SHA-256 + AES-GCM)

const STORAGE_KEY = "fannon_users";
const SESSION_KEY = "fannon_session";
const CRYPTO_KEY_RAW = "fannon_secret_key_2025";

export function sanitizeUsername(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9\-._]/g, "");
}

export function isValidUsername(username) {
  return /^[a-z0-9\-._]+$/.test(username);
}

async function getKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(CRYPTO_KEY_RAW), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("fannon_salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data) {
  const key = await getKey();
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(base64) {
  const key = await getKey();
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return await decrypt(raw); } catch { return []; }
}

async function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, await encrypt(users));
}

export async function isUsernameTaken(username, excludeUsername = null) {
  const users = await getUsers();
  return users.some(u => u.username === username.toLowerCase() && u.username !== excludeUsername);
}

export async function isEmailTaken(email, excludeEmail = null) {
  const users = await getUsers();
  return users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.email.toLowerCase() !== excludeEmail);
}

export async function register({ name, username, email, password }) {
  const clean = sanitizeUsername(username);
  if (!isValidUsername(clean)) return { ok: false, error: "username_invalid" };
  const users = await getUsers();
  if (users.some(u => u.username === clean)) return { ok: false, error: "username" };
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: "email" };
  const hashed = await hashPassword(password);
  users.push({ name, username: clean, email, password: hashed, type: "user", avatar: "", usernameChangedAt: null });
  await saveUsers(users);
  return { ok: true };
}

export async function login({ email, password }) {
  const users = await getUsers();
  const hashed = await hashPassword(password);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashed);
  if (!user) return { ok: false };
  const { password: _, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return { ok: true, user: safeUser };
}

export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function updateSession(user) {
  const { password: _, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return safeUser;
}

// ── Edição de perfil ───────────────────────────────────────────────

export async function updateName(username, newName) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: "not_found" };
  users[idx].name = newName;
  await saveUsers(users);
  return { ok: true, session: updateSession(users[idx]) };
}

export async function updateEmail(username, newEmail, password) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: "not_found" };
  const hashed = await hashPassword(password);
  if (users[idx].password !== hashed) return { ok: false, error: "wrong_password" };
  if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase() && u.username !== username))
    return { ok: false, error: "email_taken" };
  users[idx].email = newEmail;
  await saveUsers(users);
  return { ok: true, session: updateSession(users[idx]) };
}

export async function updatePassword(username, currentPassword, newPassword) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: "not_found" };
  const hashed = await hashPassword(currentPassword);
  if (users[idx].password !== hashed) return { ok: false, error: "wrong_password" };
  users[idx].password = await hashPassword(newPassword);
  await saveUsers(users);
  return { ok: true };
}

export async function updateUsername(currentUsername, newUsername, password) {
  const clean = sanitizeUsername(newUsername);
  if (!isValidUsername(clean)) return { ok: false, error: "username_invalid" };
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === currentUsername);
  if (idx === -1) return { ok: false, error: "not_found" };
  const hashed = await hashPassword(password);
  if (users[idx].password !== hashed) return { ok: false, error: "wrong_password" };

  // Limite de 1x a cada 24h
  const last = users[idx].usernameChangedAt;
  if (last && Date.now() - new Date(last).getTime() < 86400000)
    return { ok: false, error: "cooldown" };

  if (users.some(u => u.username === clean && u.username !== currentUsername))
    return { ok: false, error: "username_taken" };

  users[idx].username = clean;
  users[idx].usernameChangedAt = new Date().toISOString();
  await saveUsers(users);
  return { ok: true, session: updateSession(users[idx]) };
}

export async function updateAvatar(username, base64) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false };
  users[idx].avatar = base64;
  await saveUsers(users);
  return { ok: true, session: updateSession(users[idx]) };
}

export async function deleteAccount(username, password) {
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: "not_found" };
  const hashed = await hashPassword(password);
  if (users[idx].password !== hashed) return { ok: false, error: "wrong_password" };
  users.splice(idx, 1);
  await saveUsers(users);
  localStorage.removeItem(SESSION_KEY);
  return { ok: true };
}