import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";


export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const API_URL = 'https://dashboard-backend-teste.onrender.com';

  const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  setError(null);

  const { username, password } = formData;

  if (!username.trim() || !password.trim()) {
    setError("Por favor, preencha todos os campos");
    setLoading(false);
    return;
  }

  try {
    // Primeiro passo: chama /login-step que retorna mfa_required ou tokens diretos
    const response = await fetch(`${API_URL}/api/auth/login-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) throw new Error("Falha na autenticação");

    const data = await response.json();

    if (data.mfa_required) {
      // Pedido de MFA: pergunta o código ao usuário antes de emitir tokens
      const code = window.prompt("Sua conta exige MFA. Digite o código do seu app autenticador:");
      if (!code) throw new Error("Código MFA não fornecido");

      const verifyResp = await fetch(`${API_URL}/api/auth/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_token: data.mfa_token, code })
      });

      if (!verifyResp.ok) {
        const t = await verifyResp.text();
        throw new Error(t || "Falha na verificação MFA");
      }

      const verifyData = await verifyResp.json();
      const token = verifyData.access_token;
      localStorage.setItem("access_token", token);
      if (onLoginSuccess) onLoginSuccess(token);

      // buscar dados do usuário e armazenar para sessão consistente entre abas
      try {
        const meResp = await fetch(`${API_URL}/api/auth/me`, { headers: { "Authorization": `Bearer ${token}` } });
        if (meResp.ok) {
          const me = await meResp.json();
          try { localStorage.setItem("current_user", JSON.stringify(me)); } catch (e) { console.warn(e); }
        }
      } catch (e) {
        console.warn("Falha ao obter usuário /me:", e);
      }
      navigate("/dashboard");
    } else {
      // Sem MFA: tokens diretos
      const token = data.access_token;
      if (!token) throw new Error("Token não encontrado");
      localStorage.setItem("access_token", token);
      if (onLoginSuccess) onLoginSuccess(token);

      try {
        const meResp = await fetch(`${API_URL}/api/auth/me`, { headers: { "Authorization": `Bearer ${token}` } });
        if (meResp.ok) {
          const me = await meResp.json();
          try { localStorage.setItem("current_user", JSON.stringify(me)); } catch (e) { console.warn(e); }
        }
      } catch (e) {
        console.warn("Falha ao obter usuário /me:", e);
      }
      navigate("/dashboard");
    }

  } catch (err) {
    console.error("Erro no login:", err);
    setError(err.message || "Erro ao fazer login");
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div style={{...styles.container, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", marginTop: "4rem" }}>
      <h1 style={{...styles.title, marginBottom: "1rem" }}>Deméter - Monitoring Dashboard</h1>
      <img src={logo} alt="Deméter Logo" style={{width:120, height:40, marginBottom:24}} />
        <div style={styles.loginBox}>
          <h2 style={{...styles.title, marginBottom:8}}>Acesse sua conta</h2>

        <div style={styles.formContainer}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
              autoComplete="username"
              placeholder="Digite seu usuário"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
              autoComplete="current-password"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <div style={styles.error} role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
              padding: "10px 14px",
              fontSize: "14px",
              width: "100%",
              maxWidth: "320px",
              marginTop: 12
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "30vw",
    minWidth: "400px",
    backgroundColor: "rgb(255, 255, 255)",
    padding: "32px",
    borderRadius: "8px",
    height: "100vh",

  },
  loginBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignitems: "center",
    justifyContent: "center",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "24px",
    textAlign: "center",
    color: "#333"
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "75%",
    margin: "auto",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#555"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  },
  error: {
    padding: "12px",
    backgroundColor: "#fee",
    color: "#c33",
    borderRadius: "4px",
    fontSize: "14px",
    border: "1px solid #fcc"
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#22aa38",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "8px"
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    cursor: "not-allowed",
    opacity: 0.6
  }
};