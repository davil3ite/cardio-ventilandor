export function getUsers() {
  return JSON.parse(localStorage.getItem("fannon_users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("fannon_users", JSON.stringify(users));
}

export function isUsernameTaken(username) {
  const users = getUsers();
  return users.some((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function isEmailTaken(email) {
  const users = getUsers();
  return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function register({ name, username, email, password }) {
  if (isUsernameTaken(username)) return { ok: false, error: "username" };
  if (isEmailTaken(email)) return { ok: false, error: "email" };
  const users = getUsers();
  users.push({ name, username, email, password, type: "user" }); // mude "user" pra "adm" manualmente se precisar
  saveUsers(users);
  return { ok: true };
}

export function login({ email, password }) {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return { ok: false };
  localStorage.setItem("fannon_session", JSON.stringify(user));
  return { ok: true, user };
}

export function getSession() {
  return JSON.parse(localStorage.getItem("fannon_session") || "null");
}

export function logout() {
  localStorage.removeItem("fannon_session");
}