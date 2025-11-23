// services/api.js - Endpoints centralizados
// Atualizar em produção: inserir URL da API no Netlify/Render em VITE_API_URL
const API_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "https://dashboard-backend-teste.onrender.com/api"; // // Atualizar Render: inserir URL final da API aqui

// Função para verificar se o token JWT está expirado
const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch (e) {
    console.error("Erro ao verificar token:", e);
    return true;
  }
};

async function request(path, options = {}) {
  const headers = options.headers || {};
  const token = localStorage.getItem("access_token");
  
  console.log(`🔗 API Request: ${path}`, { 
    hasToken: !!token,
    method: options.method || 'GET'
  });

  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Sessão expirada");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  
  try {
    const fullUrl = `${API_URL}${path}`;
    console.log(`🌐 Fetching: ${fullUrl}`);
    
    const res = await fetch(fullUrl, { ...options, headers });
    
    console.log(`📨 Response: ${res.status} ${res.statusText}`);
    
    if (res.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Sessão expirada");
    }
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ API Error: ${res.status}`, text);
      throw new Error(text || `Erro ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json().catch(() => ({}));
    console.log(`✅ API Success:`, data);
    return data;
    
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    throw error;
  }
}

const api = {
  login: async (username, password) => {
    const data = await request("/auth/login", { 
      method: "POST", 
      body: JSON.stringify({ username, password }) 
    });
    
    if (data && data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return data;
    }
    throw new Error("Resposta de login inválida");
  },
  
  getSilos: () => request("/silos"),
  getUsers: () => request("/users"),
  
  getReadings: (siloId, limit = 100) => {
    const queryParams = new URLSearchParams();
    if (siloId) queryParams.append("silo_id", siloId);
    queryParams.append("limit", limit);
    return request(`/readings?${queryParams.toString()}`);
  },
  
  getAlerts: () => request("/alerts"),

  // Weather helpers
  getWeatherForLocation: (lat, lon) => request(`/weather/for-location?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
  getWeatherLatest: (lat, lon) => request(`/weather/latest?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
  fetchWeatherWeekly: (lat, lon, siloId) => request(`/weather/fetch-weekly`, { method: 'POST', body: JSON.stringify({ lat, lon, silo_id: siloId }) }),
  
  sendSubscription: (sub) => 
    request("/notifications/subscribe", { 
      method: "POST", 
      body: JSON.stringify(sub) 
    }),
  
  unsubscribe: (endpoint) => 
    request("/notifications/unsubscribe", { 
      method: "POST", 
      body: JSON.stringify({ endpoint }) 
    }),
  
  adminListSubscriptions: () => request("/notifications/admin/subscriptions")
};

// Generic GET helper
api.get = (path) => request(path);

// Método auxiliar PUT
api.put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
// Método auxiliar POST
api.post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });

export default api;
