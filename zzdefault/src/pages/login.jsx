import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../auth.js";
import "./css/login.css";

function Login() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fannon_theme") !== "light");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  function toggleTheme() {
    setDarkMode(v => {
      const next = !v;
      localStorage.setItem("fannon_theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (!result.ok) {
      setError("Email ou senha incorretos.");
      return;
    }
    navigate("/");
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
          <button className="btn-login active">Login</button>
          <button className="btn-signup" onClick={() => navigate("/signup")}>Sign up</button>
        </div>
      </header>

      <main className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Entrar</h1>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" name="email" placeholder="seu@email.com"
              value={form.email} onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <label>Senha</label>
            <input
              type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="auth-switch">
            Não tem conta?{" "}
            <span onClick={() => navigate("/signup")}>Criar conta</span>
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

export default Login;