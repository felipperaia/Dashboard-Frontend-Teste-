import React, { useEffect } from "react";
import api from "../services/api"; // ✅ CORREÇÃO: Importação sem chaves

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        console.warn("Service workers não são suportados");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service worker registrado com sucesso", registration);

        // Verificar se as notificações push são suportadas
        if (!("PushManager" in window)) {
          console.warn("Push notifications não são suportadas");
          return;
        }

        // Verificar permissão atual
        let permission = Notification.permission;
        
        // Se a permissão foi negada várias vezes, não tentar novamente
        if (permission === "denied") {
          console.warn("Permissão para notificações foi negada pelo usuário");
          return;
        }

        // Se a permissão não foi solicitada ainda, solicitar
        if (permission === "default") {
          try {
            permission = await Notification.requestPermission();
          } catch (err) {
            console.warn("Erro ao solicitar permissão:", err);
            return;
          }
        }

        if (permission !== "granted") {
          console.warn("Permissão para notificações não concedida");
          return;
        }

        try {
          // ✅ CORREÇÃO: URL correta para VAPID public key
          const vapidResp = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/notifications/vapid_public`
          );
          
          if (!vapidResp.ok) {
            throw new Error(`HTTP error! status: ${vapidResp.status}`);
          }
          
          const json = await vapidResp.json();
          const vapidPublicKey = json.vapid_public_key;
          
          if (!vapidPublicKey) {
            console.warn("Chave VAPID pública não encontrada na resposta");
            return;
          }

          // Verificar se há subscription existente
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // Criar nova subscription
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
          }

          // Enviar subscription para o backend
          await api.sendSubscription({
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys
          });
          
          // Armazenar endpoint localmente para referência futura
          try {
            localStorage.setItem("sw_subscription_endpoint", subscription.endpoint);
          } catch (e) {
            console.warn("Não foi possível armazenar endpoint:", e);
          }
          
          console.log("Subscription enviada ao backend com sucesso");
        } catch (e) {
          console.warn("Erro no processo de subscription:", e);
        }
      } catch (error) {
        console.warn("Falha ao registrar service worker:", error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}

// Helper function para converter chave VAPID
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  
  // Adicionar padding se necessário
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  try {
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (e) {
    console.error("Erro ao converter chave VAPID:", e);
    return null;
  }
}