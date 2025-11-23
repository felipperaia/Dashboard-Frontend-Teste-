import React, { useEffect, useState } from "react";
import styled from "styled-components";

// =======================
// Styled Components
// =======================

const Panel = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  max-width: 650px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  h2 {
    margin-bottom: 20px;
    font-size: 26px;
    font-weight: 700;
    color: #000;
    
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;

  label {
    font-size: 17px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #000;

    input[type="checkbox"] {
      transform: scale(1.3);
      accent-color: #16a34a; /* VERDE */
      cursor: pointer;
    }
  }
`;

const SaveButton = styled.button`
  margin-top: 16px;
  padding: 12px 22px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 17px;

  background: #16a34a;
  color: white;

  transition: 0.2s;

  &:hover {
    background: #15803d;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// =======================
// Componente React
// =======================

export default function Notifications() {
  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    telegram: false,
    popup: true
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notif_prefs");
      if (raw) setPrefs(JSON.parse(raw));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const toggle = (k) => {
    setPrefs(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem("notif_prefs", JSON.stringify(prefs));
      alert("Preferências salvas localmente.");
    } catch (e) {
      console.error(e);
      alert("Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <h2>Notificações</h2>

      <Content>
        <label>
          <input
            type="checkbox"
            checked={prefs.email}
            onChange={() => toggle("email")}
          />
          Email
        </label>

        <label>
          <input
            type="checkbox"
            checked={prefs.sms}
            onChange={() => toggle("sms")}
          />
          SMS
        </label>

        <label>
          <input
            type="checkbox"
            checked={prefs.popup}
            onChange={() => toggle("popup")}
          />
          Pop-up (browser)
        </label>

        <label>
          <input
            type="checkbox"
            checked={prefs.telegram}
            onChange={() => toggle("telegram")}
          />
          Telegram
        </label>

        <SaveButton onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </SaveButton>
      </Content>
    </Panel>
  );
}
