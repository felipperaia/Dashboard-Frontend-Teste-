import React, { useEffect, useState } from "react";
import { BrowserRouter as Router,Navigate, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import api from "./services/api";
import imgSilos from "./assets/silos-2.jpg";
import "./app.css";
import { Header } from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import MFA from "./pages/MFA";
import Chat from "./pages/Chat";

function AppContent({ pushEnabled, unsubscribeAndLogout }) {
  const location = useLocation();
  const noHeaderRoutes = ["/login"];
  const shouldShowHeader = !noHeaderRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowHeader && (
        <Header
          pushEnabled={pushEnabled}
          unsubscribeAndLogout={unsubscribeAndLogout}
        />
      )}
      <Routes>
         <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/mfa" element={<MFA />} />
          <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub && sub.endpoint) {
              setPushEnabled(true);
              return;
            }
          }
        }
        const endpoint = localStorage.getItem("sw_subscription_endpoint");
        setPushEnabled(!!endpoint);
      } catch (e) {
        console.warn("Erro verificando push subscription:", e);
        setPushEnabled(false);
      }
    })();
  }, []);

  const unsubscribeAndLogout = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await api.unsubscribe(sub.endpoint);
            await sub.unsubscribe();
          }
          await reg.unregister();
        }
      } else {
        const endpoint = localStorage.getItem("sw_subscription_endpoint");
        if (endpoint) {
          await api.unsubscribe(endpoint);
        }
      }
    } catch (err) {
      console.warn("Erro no processo de unsubscribe:", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("sw_subscription_endpoint");
      setPushEnabled(false);
      navigate("/login");
    }
  };

  return (
    <div
      className="background"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundImage: `url(${imgSilos})`,
        minHeight: "100vh",
      }}
    >
      <main className="main">
        {/* ✅ passando as props necessárias */}
        <AppContent
          pushEnabled={pushEnabled}
          unsubscribeAndLogout={unsubscribeAndLogout}
        />
      </main>
    </div>
  );
}

