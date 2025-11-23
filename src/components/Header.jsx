import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Bell, User, Home, MessageSquare, Menu, X } from "lucide-react";
import axios from "axios";
import styled from "styled-components";

// 👉 Configuração base da API
const API_BASE = "https://dashboard-iot-silos-backend-1.onrender.com";
const getAuthToken = () => localStorage.getItem("access_token");

const getHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
});

// -----------------------------------------------------
//   COMPONENTE PRINCIPAL
// -----------------------------------------------------
export const Header = ({ pushEnabled }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Usuário");
  const [userRole, setUserRole] = useState("Operador");

  const [menuOpen, setMenuOpen] = useState(false); // 👈 CONTROLA O MENU HAMBÚRGUER

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem("current_user");
        if (raw) {
          const u = JSON.parse(raw);
          setUserName(u.name || u.username || "Usuário");
          setUserRole(u.role || "Operador");
        }
      } catch {}
    };

    loadFromStorage();
    window.addEventListener("storage", loadFromStorage);
    return () => window.removeEventListener("storage", loadFromStorage);
  }, []);

  return (
    <HeaderWrapper>
      <Title>Deméter - Monitoring Dashboard</Title>

      {/* BOTÃO HAMBÚRGUER (MOBILE) */}
      <HamburgerButton onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={26} /> : <Menu size={26} />}
      </HamburgerButton>

      {/* MENU NORMAL (DESKTOP) */}
      <NavContainer>
        <Button onClick={() => navigate("/dashboard")}>
          <Home size={18} />
          <span>Dashboard</span>
        </Button>

        <Button onClick={() => navigate("/chat")}>
          <MessageSquare size={18} />
          <span>Assistente Deméter</span>
        </Button>

        <Button onClick={() => navigate("/settings")}>
          <Settings size={18} />
          <span>Configurações</span>
        </Button>

        <Button onClick={() => navigate("/notifications")} $relative>
          <Bell size={18} />
          <span>Notificações</span>
          {pushEnabled && <NotificationDot />}
        </Button>

        <Button onClick={() => navigate("/profile")} $withGap>
          <User size={18} />
          <UserInfo>
            <UserName>{userName}</UserName>
            <UserRole>{userRole}</UserRole>
          </UserInfo>
          <Underline />
        </Button>
      </NavContainer>

      {/* MENU MOBILE ABERTO */}
      {menuOpen && (
        <MobileMenu>
          <MobileButton onClick={() => navigate("/dashboard")}>
            <Home size={20} />
            Dashboard
          </MobileButton>

          <MobileButton onClick={() => navigate("/chat")}>
            <MessageSquare size={20} />
            Assistente Deméter
          </MobileButton>

          <MobileButton onClick={() => navigate("/settings")}>
            <Settings size={20} />
            Configurações
          </MobileButton>

          <MobileButton onClick={() => navigate("/notifications")}>
            <Bell size={20} />
            Notificações
          </MobileButton>

          <MobileButton onClick={() => navigate("/profile")}>
            <User size={20} />
            Perfil
          </MobileButton>
        </MobileMenu>
      )}
    </HeaderWrapper>
  );
};

// -----------------------------------------------------
//   STYLED COMPONENTS
// -----------------------------------------------------

const HeaderWrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 85.5%;
  padding: 16px 0px;
  position: relative;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
`;

const NavContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    display: none; /* escondido no mobile */
  }
`;

const Button = styled.button`
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$withGap ? "8px" : "6px")};
  cursor: pointer;
  transition: 0.2s;
  color: #ffffff;
  position: ${(props) => (props.$relative ? "relative" : "initial")};

  &:hover {
    background: rgba(107, 114, 128, 0.2);
  }

  span {
    font-size: 14px;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  display: none;
  color: white;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: 70px;
  right: 0;
  width: 200px;
  background: #1f2937;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileButton = styled.button`
  background: rgba(107, 114, 128, 0.2);
  border: 1px solid rgba(107, 114, 128, 0.3);
  padding: 10px;
  border-radius: 6px;
  color: white;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  &:hover {
    background: rgba(107, 114, 128, 0.35);
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
`;

const UserRole = styled.span`
  font-size: 12px;
  color: #e5e7eb;
`;

const Underline = styled.div`
  width: 40px;
  height: 2px;
  background: #fff;
  margin-top: 6px;
  border-radius: 2px;
`;
