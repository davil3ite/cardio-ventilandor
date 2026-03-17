import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { register, isUsernameTaken } from "../auth.js";
import "./css/signup.css";

function Signup() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "", confirm: "",
  });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    if (e.target.name === "username") setUsernameStatus(null);
  }

  useEffect(() => {
    if (!form.username) { setUsernameStatus(null); return; }
    setUsernameStatus("checking");
    const t = setTimeout(() => {
      setUsernameStatus(isUsernameTaken(form.username) ? "taken" : "available");
    }, 500);
    return () => clearTimeout(t);
  }, [form.username]);

  function toggleTheme() {
    setDarkMode(v => {
      const next = !v;
      localStorage.setItem("fannon_theme", next ? "dark" : "light");
      return next;
    });
  }

  function handleSubmit() {
    if (!form.name || !form.username || !form.email || !form.password || !form.confirm) {
      setError("Preencha todos os campos."); return;
    }
    if (usernameStatus === "taken") { setError("Nome de usuário já existe."); return; }
    if (form.password !== form.confirm) { setError("As senhas não coincidem."); return; }
    if (form.password.length < 6) { setError("A senha precisa ter ao menos 6 caracteres."); return; }

    const result = register(form);
    if (!result.ok) {
      if (result.error === "username") setError("Nome de usuário já existe.");
      if (result.error === "email") setError("Este email já está cadastrado.");
      return;
    }
    navigate("/login");
  }

  return (
    <div className={darkMode ? "theme-dark" : "theme-light"}>
      <header className="header">
        <div className="header-left" />
        <div className="header-center">
          <button className="btn-logo" onClick={() => navigate("/")}>
            <img src="/logofannonmetalic.png" style={{ height: "65px", width: "auto" }} />
          </button>
        </div>
        <div className="header-right">
          <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-signup active">Sign up</button>
        </div>
      </header>

      <main className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Criar conta</h1>

          <div className="auth-field">
            <label>Nome</label>
            <input
              type="text" name="name" placeholder="Seu nome"
              value={form.name} onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Nome de usuário</label>
            <div className="username-wrap">
              <input
                type="text" name="username" placeholder="@usuario"
                value={form.username} onChange={handleChange}
              />
              {usernameStatus === "checking" && <span className="ucheck checking">Verificando...</span>}
              {usernameStatus === "available" && <span className="ucheck available">✓ Disponível</span>}
              {usernameStatus === "taken" && <span className="ucheck taken">✗ Indisponível</span>}
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" name="email" placeholder="seu@email.com"
              value={form.email} onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Senha</label>
            <input
              type="password" name="password" placeholder="Mín. 6 caracteres"
              value={form.password} onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Confirmar senha</label>
            <input
              type="password" name="confirm" placeholder="••••••••"
              value={form.confirm} onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" onClick={handleSubmit}>Criar conta</button>

          <p className="auth-switch">
            Já tem conta?{" "}
            <span onClick={() => navigate("/login")}>Entrar</span>
          </p>
        </div>
      </main>

      <div className="auth-theme">
        <span className="theme-label">{darkMode ? "Escuro" : "Claro"}</span>
        <button
          className={`theme-switch ${darkMode ? "on" : ""}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        />
      </div>
    </div>
  );
}

export default Signup;