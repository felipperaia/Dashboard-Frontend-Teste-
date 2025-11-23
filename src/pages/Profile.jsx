import React from "react";
import styled from "styled-components";

// =======================
// Styled Components
// =======================

const Panel = styled.div`
  background: #fff;
  color: #111 !important;   /* <-- força o texto a ser escuro */

  padding: 32px;
  border-radius: 12px;
  max-width: 650px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  h2 {
    color: #111;
  }

  p {
    color: #222;

    strong {
      color: #111;
    }
  }
`;


const LogoutButton = styled.button`
  margin-top: 18px;
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
`;

// =======================
// Componente React
// =======================

export default function Profile() {
  const raw = localStorage.getItem("current_user");
  const user = raw ? JSON.parse(raw) : null;

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    window.location.href = "https://splendorous-dusk-f86c65.netlify.app";
  };

  if (!user) return <Panel>Nenhum usuário ativo</Panel>;

  return (
    <Panel>
      <h2>Perfil</h2>

      <p><strong>Nome:</strong> {user.name || user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>

      <LogoutButton onClick={logout}>
        Sair
      </LogoutButton>
    </Panel>
  );
}
