import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { Line } from "react-chartjs-2";
import tempIcon from "../assets/icons/thermometer.png";
import humidityIcon from "../assets/icons/humidity.png";
import co2Icon from "../assets/icons/co2.png";
import gasIcon from "../assets/icons/gas.png";
import lightIcon from "../assets/icons/light.png";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import styled from "styled-components";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Container = styled.div`
  display: flex;
  min-height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  width: 70vw;

  @media (max-width: 768px) {
    flex: 1;
    margin: auto;
    overflow-y: auto;
    width: 80vw;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 2px;
  justify-content: end;

  @media (max-width: 768px) {
    display: flex;
    gap: 3px;
    margin-bottom: 25px;
    border-bottom: 2px solid rgb(226, 232, 240);
    padding-bottom: 2px;
    justify-content: center;

    button {
      padding: 8px 12px !important;
    }
  }
`;

const TabButton = styled.button`
  padding: 8px 16px;
  border-radius: 999px 999px 0 0;
  border: none;
  background: ${(p) => (p.active ? "#2563eb" : "transparent")};
  color: ${(p) => (p.active ? "#fff" : "#111827")};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const s = {
  card: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827"
  },
  select: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 13
  },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 13,
    width: "100%"
  },
  button: {
    padding: "8px 16px",
    background: "#2563eb",
    borderRadius: 999,
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  buttonSmall: {
    padding: "6px 10px",
    background: "#2563eb",
    borderRadius: 999,
    border: "none",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  weatherControls: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  searchInput: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    fontSize: 13,
    minWidth: 220
  },
  weatherLeft: {
    minWidth: 80
  },
  weatherBigTemp: {
    fontSize: 36,
    fontWeight: 800,
    color: "#ef4444",
    lineHeight: 1
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8
  }
};

export default function Dashboard() {
  const [silos, setSilos] = useState([]);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [meteorology, setMeteorology] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("weather_location") || "null");
    } catch {
      return null;
    }
  });
  const [weatherQuery, setWeatherQuery] = useState("");
  const [geoResults, setGeoResults] = useState([]);
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSilo, setSelectedSilo] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newSilo, setNewSilo] = useState({
    name: "",
    device_id: "",
    latitude: "",
    longitude: "",
    capacity: ""
  });
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [newReading, setNewReading] = useState({
    silo_id: "",
    temp_C: "",
    rh_pct: "",
    co2_ppm_est: "",
    mq2_raw: "",
    luminosity_alert: 0,
    lux: ""
  });

  // estados do 4º card
  const [selectedSiloAnalysis, setSelectedSiloAnalysis] = useState("");
  const [analysisMetrics, setAnalysisMetrics] = useState(null);
  const [analysisForecastByTarget, setAnalysisForecastByTarget] = useState({});
  const [analysisExplanation, setAnalysisExplanation] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem("access_token")
  );

  const API_BASE = "https://dashboard-backend-teste.onrender.com";
  const getHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json"
  });

  const apiClient = api;

  const saveWeatherLocation = (loc) => {
    try {
      localStorage.setItem("weather_location", JSON.stringify(loc));
      setWeatherLocation(loc);
    } catch (e) {
      console.warn("Não foi possível salvar local", e);
    }
  };

  const loadWeatherForLocation = async (lat, lon, name) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let data;
      if (apiClient && apiClient.getWeatherForLocation) {
        data = await apiClient.getWeatherForLocation(lat, lon);
      } else {
        const url = `${API_BASE}/api/weather/for-location?lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lon)}`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) throw new Error("Erro ao buscar meteorologia");
        data = await res.json();
      }
      setWeatherData(data);
      if (name || (data && data.location && data.location.name))
        saveWeatherLocation({
          lat,
          lon,
          name: name || (data.location && data.location.name)
        });
    } catch (e) {
      console.warn("loadWeatherForLocation erro", e);
      setWeatherError(e.message || "Erro ao carregar previsão");
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (weatherLocation && weatherLocation.lat && weatherLocation.lon) {
      loadWeatherForLocation(
        weatherLocation.lat,
        weatherLocation.lon,
        weatherLocation.name
      );
    }
  }, []);

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo navegador");
      return;
    }
    setUsingDeviceLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        await loadWeatherForLocation(lat, lon, "Local Atual");
        setUsingDeviceLocation(false);
      },
      (err) => {
        alert("Permissão negada ou erro: " + err.message);
        setUsingDeviceLocation(false);
      }
    );
  };

  const searchLocationByName = async (q) => {
    setWeatherQuery(q);
    if (!q || q.length < 2) {
      setGeoResults([]);
      return;
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=6&language=pt`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar locais");
      const j = await res.json();
      setGeoResults(j.results || []);
    } catch (e) {
      console.warn("geocoding erro", e);
      setGeoResults([]);
    }
  };

  const selectGeo = (r) => {
    const lat = r.latitude;
    const lon = r.longitude;
    const name = r.name + (r.admin1 ? `, ${r.admin1}` : "");
    saveWeatherLocation({ lat, lon, name });
    setGeoResults([]);
    setWeatherQuery("");
    loadWeatherForLocation(lat, lon, name);
  };

  const fetchSilos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/silos/`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao buscar silos");
      const data = await res.json();
      setSilos(data || []);
      if (data.length > 0 && !selectedSilo) setSelectedSilo(data[0]._id);
    } catch (err) {
      setError("Erro ao carregar silos");
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (siloId) => {
    try {
      setLoading(true);
      const url = siloId
        ? `${API_BASE}/api/readings?silo_id=${siloId}&limit=100`
        : `${API_BASE}/api/readings?limit=100`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error("Erro ao buscar leituras");
      const data = await res.json();
      setReadings(data || []);
    } catch (err) {
      setError("Erro ao carregar leituras");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao buscar alertas");
      const data = await res.json();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports?limit=50`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao buscar relatórios");
      const data = await res.json();
      setReports(data || []);
    } catch (e) {
      console.warn("fetchReports erro", e);
    }
  };

  const fetchForecastsForSilo = async (siloId) => {
    try {
      if (!siloId) return;
      const res = await fetch(
        `${API_BASE}/api/ml/forecast?siloId=${siloId}&period_days=7`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("Erro ao buscar previsões");
      const data = await res.json();
      setForecasts(data || []);
    } catch (e) {
      console.warn("fetchForecastsForSilo erro", e);
    }
  };

  const createSilo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/silos/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newSilo)
      });
      if (!res.ok) throw new Error("Erro ao criar silo");
      alert("Silo criado!");
      setNewSilo({
        name: "",
        device_id: "",
        latitude: "",
        longitude: "",
        capacity: ""
      });
      fetchSilos();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const updateSiloSettings = async (siloId, settings) => {
    try {
      const res = await fetch(`${API_BASE}/api/silos/${siloId}/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      alert("Configurações atualizadas!");
      fetchSilos();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const createReading = async () => {
    try {
      const deviceIdFromSilo = selectedSilo
        ? silos.find((s) => s._id === selectedSilo)?.device_id
        : undefined;
      const res = await fetch(`${API_BASE}/api/readings/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newReading,
          silo_id: newReading.silo_id || selectedSilo,
          device_id: newReading.device_id || deviceIdFromSilo || "",
          timestamp: new Date().toISOString(),
          temp_C: parseFloat(newReading.temp_C),
          rh_pct: parseFloat(newReading.rh_pct),
          co2_ppm_est: newReading.co2_ppm_est
            ? parseFloat(newReading.co2_ppm_est)
            : undefined,
          mq2_raw: newReading.mq2_raw
            ? parseInt(newReading.mq2_raw, 10)
            : undefined,
          luminosity_alert:
            typeof newReading.luminosity_alert !== "undefined"
              ? newReading.luminosity_alert
              : undefined,
          lux: newReading.lux ? parseFloat(newReading.lux) : undefined
        })
      });
      if (!res.ok) throw new Error("Erro ao criar leitura");
      alert("Leitura criada!");
      setNewReading({
        silo_id: "",
        temp_C: "",
        rh_pct: "",
        co2_ppm_est: "",
        mq2_raw: "",
        luminosity_alert: 0,
        lux: ""
      });
      fetchReadings(selectedSilo);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const createUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error("Erro ao criar usuário");
      alert("Usuário criado!");
      setNewUser({ username: "", email: "", password: "" });
      fetchUsers();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/ack/${alertId}`, {
        method: "POST",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Erro ao confirmar alerta");
      alert("Alerta confirmado!");
      fetchAlerts();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const subscribeNotifications = async () => {
    try {
      const vapidRes = await fetch(
        `${API_BASE}/api/notifications/vapid_public`,
        { headers: getHeaders() }
      );
      const vapidData = await vapidRes.json();
      alert("VAPID Key obtida: " + vapidData.public_key);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  // Função do 4º card
  const loadForecastsAndMetrics = async (siloId) => {
    if (!siloId) return;
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      const readingsRes = await fetch(
        `${API_BASE}/api/readings?silo_id=${siloId}&start=${thirtyDaysAgo.toISOString()}&end=${now.toISOString()}`,
        { headers: getHeaders() }
      );
      if (!readingsRes.ok) throw new Error("Erro ao carregar leituras");
      const readingsData = await readingsRes.json();

      const temps = readingsData
        .filter((r) => r.temperature != null || r.temp_C != null)
        .map((r) => (r.temperature != null ? r.temperature : r.temp_C));
      const hums = readingsData
        .filter((r) => r.humidity != null || r.rh_pct != null)
        .map((r) => (r.humidity != null ? r.humidity : r.rh_pct));
      const gases = readingsData
        .filter((r) => r.gas != null || r.mq2_raw != null)
        .map((r) => (r.gas != null ? r.gas : r.mq2_raw));

      const calcStats = (arr) => {
        if (!arr || arr.length === 0)
          return {
            min: null,
            max: null,
            avg: null,
            p50: null,
            count: 0,
            stddev: null
          };
        const sorted = [...arr].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        const p50 = sorted[Math.floor(sorted.length / 2)];
        const stddev = Math.sqrt(
          sorted
            .map((x) => (x - avg) ** 2)
            .reduce((a, b) => a + b, 0) / sorted.length
        );
        return { min, max, avg, p50, count: sorted.length, stddev };
      };

      setAnalysisMetrics({
        temperature: calcStats(temps),
        humidity: calcStats(hums),
        gas: calcStats(gases)
      });

      const forecastRes = await fetch(
        `${API_BASE}/api/ml/forecast?siloId=${siloId}&period_days=7`,
        { headers: getHeaders() }
      );
      if (!forecastRes.ok) throw new Error("Erro ao carregar previsões");
      const forecastsData = await forecastRes.json();
      const byTarget = {};
      forecastsData.forEach((f) => {
        const t = f.target || "unknown";
        if (!byTarget[t]) byTarget[t] = [];
        byTarget[t].push(f);
      });
      setAnalysisForecastByTarget(byTarget);

      try {
        const textRes = await fetch(
          `${API_BASE}/api/ml/forecast/text?siloId=${siloId}&period_days=7`,
          { headers: getHeaders() }
        );
        if (textRes.ok) {
          const textData = await textRes.json();
          setAnalysisExplanation(textData.text || "Sem análise disponível.");
        } else {
          setAnalysisExplanation("Não foi possível gerar análise textual.");
        }
      } catch {
        setAnalysisExplanation("Não foi possível gerar análise textual.");
      }

      setAnalysisLoading(false);
    } catch (e) {
      console.error(e);
      setAnalysisError(e.message || "Erro ao carregar análise");
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchSilos();
    fetchAlerts();
    fetchUsers();
    fetchReports();
    const repInterval = setInterval(() => fetchReports(), 60 * 1000);
    return () => clearInterval(repInterval);
  }, []);

  useEffect(() => {
    if (selectedSilo) fetchReadings(selectedSilo);
  }, [selectedSilo]);

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => {
      try {
        const url = selectedSilo
          ? `${API_BASE}/api/weather/latest?silo_id=${selectedSilo}`
          : `${API_BASE}/api/weather/latest?limit=10`;
        const res = await fetch(url, { headers: getHeaders() });
        if (res.ok && mounted) {
          const data = await res.json();
          setMeteorology(data || []);
        }
      } catch (e) {
        console.warn("Erro ao carregar meteorologia automaticamente", e);
      }
    };

    if (activeTab === "report") {
      doLoad();
      const iv = setInterval(doLoad, 2 * 60 * 1000);
      fetchForecastsForSilo(selectedSilo);
      return () => {
        mounted = false;
        clearInterval(iv);
      };
    }
  }, [activeTab, selectedSilo]);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("current_user") || "{}");
    } catch {
      return {};
    }
  })();
  const isAdmin = currentUser && currentUser.role === "admin";

  const calculateMetrics = () => {
    if (!readings.length)
      return {
        avgTemp: 0,
        avgHumidity: 0,
        tempTrend: "stable",
        humTrend: "stable"
      };

    const recent = readings.slice(-10);
    const older = readings.slice(-20, -10);

    const avgTemp =
      recent.reduce((sum, r) => sum + r.temp_C / 10, 0) / recent.length;
    const avgHumidity =
      recent.reduce((sum, r) => sum + r.rh_pct / 10, 0) / recent.length;

    const oldAvgTemp = older.length
      ? older.reduce((sum, r) => sum + r.temp_C, 0) / older.length
      : avgTemp;
    const oldAvgHum = older.length
      ? older.reduce((sum, r) => sum + r.rh_pct, 0) / older.length
      : avgHumidity;

    const tempTrend =
      avgTemp > oldAvgTemp ? "up" : avgTemp < oldAvgTemp ? "down" : "stable";
    const humTrend =
      avgHumidity > oldAvgHum ? "up" : avgHumidity < oldAvgHum ? "down" : "stable";

    return {
      avgTemp: avgTemp.toFixed(1),
      avgHumidity: avgHumidity.toFixed(1),
      tempTrend,
      humTrend
    };
  };

  const metrics = calculateMetrics();

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <Container>
      <MainContent>
        <Tabs>
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </TabButton>
          <TabButton
            active={activeTab === "report"}
            onClick={() => setActiveTab("report")}
          >
            Relatório
          </TabButton>
          <TabButton
            active={activeTab === "silos"}
            onClick={() => setActiveTab("silos")}
          >
            Silos
          </TabButton>
          <TabButton
            active={activeTab === "leituras"}
            onClick={() => setActiveTab("leituras")}
          >
            Leituras
          </TabButton>
          <TabButton
            active={activeTab === "alertas"}
            onClick={() => setActiveTab("alertas")}
          >
            Alertas
          </TabButton>
          <TabButton
            active={activeTab === "usuarios"}
            onClick={() => setActiveTab("usuarios")}
          >
            Usuários
          </TabButton>
        </Tabs>

        {/* DASHBOARD PRINCIPAL (simplificado) */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={s.card}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  Temperatura Média
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <img
                    src={tempIcon}
                    alt="temp"
                    style={{ width: 24, height: 24 }}
                  />
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#16a34a"
                    }}
                  >
                    {metrics.avgTemp}°C
                  </span>
                </div>
              </div>
              <div style={s.card}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  Umidade Média
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <img
                    src={humidityIcon}
                    alt="hum"
                    style={{ width: 24, height: 24 }}
                  />
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#0ea5e9"
                    }}
                  >
                    {metrics.avgHumidity}%
                  </span>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Leituras recentes</h3>
              {readings.length === 0 ? (
                <p>Nenhuma leitura registrada.</p>
              ) : (
                <div style={{ height: 260 }}>
                  <Line
                    data={{
                      labels: readings.map((r) =>
                        new Date(r.timestamp).toLocaleTimeString("pt-BR")
                      ),
                      datasets: [
                        {
                          label: "Temp (°C)",
                          borderColor: "#ef4444",
                          backgroundColor: "rgba(239,68,68,0.15)",
                          data: readings.map((r) => r.temp_C / 10)
                        },
                        {
                          label: "Umidade (%)",
                          borderColor: "#3b82f6",
                          backgroundColor: "rgba(59,130,246,0.15)",
                          data: readings.map((r) => r.rh_pct / 10)
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false }
                      },
                      scales: {
                        x: { display: true },
                        y: { display: true }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA RELATÓRIO - 4 CARDS */}
        {activeTab === "report" && (
          <div>
            {/* Card 1 - Clima / Localização */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Clima / Localização</h3>
                <div style={s.weatherControls}>
                  <input
                    style={s.searchInput}
                    placeholder="Buscar cidade ou endereço"
                    value={weatherQuery}
                    onChange={(e) => searchLocationByName(e.target.value)}
                  />
                  <button
                    style={s.buttonSmall}
                    onClick={() => useDeviceLocation()}
                  >
                    {usingDeviceLocation ? "Detectando..." : "Usar GPS"}
                  </button>
                </div>
              </div>
              <div>
                {weatherLoading ? (
                  <div>Carregando previsão...</div>
                ) : weatherError ? (
                  <div style={{ color: "#ef4444" }}>Erro: {weatherError}</div>
                ) : weatherData ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center"
                    }}
                  >
                    <div style={s.weatherLeft}>
                      <div style={s.weatherBigTemp}>
                        {weatherData.summary &&
                        typeof weatherData.summary.current_temp !==
                          "undefined"
                          ? `${Math.round(weatherData.summary.current_temp)}°C`
                          : weatherData.data &&
                            weatherData.data.current_weather &&
                            weatherData.data.current_weather.temperature
                          ? `${Math.round(
                              weatherData.data.current_weather.temperature
                            )}°C`
                          : "—"}
                      </div>
                      <div style={{ color: "#64748b" }}>
                        {weatherLocation && weatherLocation.name
                          ? weatherLocation.name
                          : weatherData.location
                          ? weatherData.location.name
                          : ""}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {(() => {
                        const m = weatherData;
                        const daily =
                          m && m.data && m.data.daily ? m.data.daily : null;
                        if (!daily)
                          return <div>Nenhuma previsão disponível.</div>;
                        const times = daily.time || [];
                        const tmax = daily.temperature_2m_max || [];
                        const tmin = daily.temperature_2m_min || [];
                        const precip = daily.precipitation_sum || [];
                        return (
                          <div style={{ display: "flex", gap: 8 }}>
                            {times.slice(0, 7).map((t, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: 8,
                                  background: "#fff",
                                  borderRadius: 8,
                                  border: "1px solid #e6eef6",
                                  textAlign: "center",
                                  minWidth: 80
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#64748b"
                                  }}
                                >
                                  {new Date(t).toLocaleDateString()}
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: "#ef4444"
                                  }}
                                >
                                  {tmax[i] ?? "—"}°
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#64748b"
                                  }}
                                >
                                  min {tmin[i] ?? "—"}°
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b"
                                  }}
                                >
                                  {precip[i] ? `${precip[i]} mm` : "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div>Selecione ou busque um local para ver a previsão.</div>
                )}
                {geoResults && geoResults.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {geoResults.map((r, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          cursor: "pointer",
                          color: "#111827"
                        }}
                        onClick={() => selectGeo(r)}
                      >
                        {r.name}
                        {r.admin1 ? `, ${r.admin1}` : ""} — {r.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2 - Relatórios Gerados */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Relatórios Gerados</h3>
              </div>
              <div>
                {reports.length === 0 ? (
                  <p>Nenhum relatório carregado.</p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {reports.map((r) => (
                      <div
                        key={r._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 8,
                          background: "#fff"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.title}</div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b"
                            }}
                          >
                            Silo: {r.silo_name} | Período:{" "}
                            {new Date(r.start).toLocaleDateString()} -{" "}
                            {new Date(r.end).toLocaleDateString()}
                          </div>
                          {r.spark_metrics &&
                            Object.keys(r.spark_metrics).length > 0 && (
                              <div
                                style={{ marginTop: 6, fontSize: 12 }}
                              >
                                {Object.entries(r.spark_metrics).map(
                                  ([t, g]) => (
                                    <div
                                      key={t}
                                      style={{ color: "#374151" }}
                                    >
                                      {t}: cnt {g.count} • avg{" "}
                                      {g.avg
                                        ? Number(g.avg).toFixed(2)
                                        : "n/a"}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <a
                            href={`${API_BASE}/api/reports/${r._id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <button style={s.buttonSmall}>Baixar PDF</button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3 - Gerar Novo Relatório */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Gerar Novo Relatório</h3>
                <div>
                  <select
                    style={s.select}
                    value={selectedSilo || ""}
                    onChange={(e) => setSelectedSilo(e.target.value)}
                  >
                    <option value="">Selecione o Silo</option>
                    {silos.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={s.form}>
                <input
                  type="date"
                  style={s.input}
                  value={reportStart}
                  onChange={(e) => setReportStart(e.target.value)}
                />
                <input
                  type="date"
                  style={s.input}
                  value={reportEnd}
                  onChange={(e) => setReportEnd(e.target.value)}
                />
                <input
                  style={s.input}
                  placeholder="Título (opcional)"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
                <textarea
                  style={{ ...s.input, minHeight: 80 }}
                  placeholder="Notas"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={s.button}
                    onClick={async () => {
                      if (!selectedSilo) {
                        alert("Selecione um silo");
                        return;
                      }
                      try {
                        const body = {
                          silo_id: selectedSilo,
                          start: new Date(reportStart).toISOString(),
                          end: new Date(reportEnd).toISOString(),
                          title: reportTitle,
                          notes: reportNotes
                        };
                        const res = await fetch(`${API_BASE}/api/reports/`, {
                          method: "POST",
                          headers: getHeaders(),
                          body: JSON.stringify(body)
                        });
                        if (!res.ok)
                          throw new Error("Erro ao gerar relatório");
                        const created = await res.json();
                        window.open(
                          `${API_BASE}/api/reports/${created._id}/pdf`,
                          "_blank"
                        );
                        fetchReports();
                      } catch (e) {
                        alert("Erro ao gerar relatório: " + e.message);
                      }
                    }}
                  >
                    Gerar Relatório (PDF)
                  </button>
                </div>
              </div>

              {forecasts.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4>Previsões geradas</h4>
                  <div style={{ display: "grid", gap: 8 }}>
                    {forecasts.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          background: "#fff"
                        }}
                      >
                        <div>
                          <strong>{f.target}</strong> | horizonte:{" "}
                          {f.horizon_hours}h | valor: {f.value_predicted}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#64748b" }}
                        >
                          forecast_at:{" "}
                          {new Date(
                            f.timestamp_forecast
                          ).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 4 - Análise de Previsões e Métricas */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Análise de Previsões e Métricas</h3>
                <div>
                  <select
                    style={s.select}
                    value={selectedSiloAnalysis || ""}
                    onChange={(e) => {
                      setSelectedSiloAnalysis(e.target.value);
                      if (e.target.value)
                        loadForecastsAndMetrics(e.target.value);
                    }}
                  >
                    <option value="">Selecione Silo para análise</option>
                    {silos.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedSiloAnalysis ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "#64748b"
                  }}
                >
                  Selecione um silo acima para ver análise de previsões e
                  métricas.
                </div>
              ) : analysisLoading ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center"
                  }}
                >
                  Carregando análise...
                </div>
              ) : analysisError ? (
                <div style={{ padding: 20, color: "#ef4444" }}>
                  Erro: {analysisError}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color: "#1f2937",
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      Resumo de Métricas (últimos 30 dias)
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          padding: 12,
                          background: "#fef3c7",
                          borderRadius: 8,
                          border: "1px solid #fde68a"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#92400e"
                          }}
                        >
                          Temperatura
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          Média:{" "}
                          <strong>
                            {analysisMetrics?.temperature?.avg?.toFixed(1) ||
                              "—"}
                            °C
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Mediana:{" "}
                          <strong>
                            {analysisMetrics?.temperature?.p50?.toFixed(1) ||
                              "—"}
                            °C
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Min/Máx:{" "}
                          <strong>
                            {analysisMetrics?.temperature?.min?.toFixed(1) ||
                              "—"}
                            °C{" "}
                            /{" "}
                            {analysisMetrics?.temperature?.max?.toFixed(1) ||
                              "—"}
                            °C
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 12,
                          background: "#dbeafe",
                          borderRadius: 8,
                          border: "1px solid #bfdbfe"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0c4a6e"
                          }}
                        >
                          Umidade
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          Média:{" "}
                          <strong>
                            {analysisMetrics?.humidity?.avg?.toFixed(1) || "—"}
                            %
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Mediana:{" "}
                          <strong>
                            {analysisMetrics?.humidity?.p50?.toFixed(1) ||
                              "—"}
                            %
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Min/Máx:{" "}
                          <strong>
                            {analysisMetrics?.humidity?.min?.toFixed(1) ||
                              "—"}
                            %{" "}
                            /{" "}
                            {analysisMetrics?.humidity?.max?.toFixed(1) ||
                              "—"}
                            %
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 12,
                          background: "#fee2e2",
                          borderRadius: 8,
                          border: "1px solid #fecaca"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#7c2d12"
                          }}
                        >
                          Gases
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          Média:{" "}
                          <strong>
                            {analysisMetrics?.gas?.avg?.toFixed(1) || "—"} ppm
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Mediana:{" "}
                          <strong>
                            {analysisMetrics?.gas?.p50?.toFixed(1) || "—"} ppm
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Máxima:{" "}
                          <strong>
                            {analysisMetrics?.gas?.max?.toFixed(1) || "—"} ppm
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 12,
                          background: "#f0fdf4",
                          borderRadius: 8,
                          border: "1px solid #dcfce7"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#15803d"
                          }}
                        >
                          Leituras
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          Temperatura:{" "}
                          <strong>
                            {analysisMetrics?.temperature?.count || 0}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Umidade:{" "}
                          <strong>
                            {analysisMetrics?.humidity?.count || 0}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          Gases:{" "}
                          <strong>
                            {analysisMetrics?.gas?.count || 0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color: "#1f2937",
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      Previsões (próximos 7 dias)
                    </h4>
                    {analysisForecastByTarget &&
                    Object.keys(analysisForecastByTarget).length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 12
                        }}
                      >
                        {Object.entries(analysisForecastByTarget).map(
                          ([target, arr]) => {
                            const values = arr
                              .map((f) => f.value_predicted)
                              .filter(
                                (v) => v !== null && v !== undefined
                              );
                            const avg =
                              values.length > 0
                                ? values.reduce((a, b) => a + b, 0) /
                                  values.length
                                : null;
                            const sorted = [...values].sort(
                              (a, b) => a - b
                            );
                            const median =
                              sorted.length > 0
                                ? sorted[Math.floor(sorted.length / 2)]
                                : null;
                            const min =
                              values.length > 0
                                ? Math.min(...values)
                                : null;
                            const max =
                              values.length > 0
                                ? Math.max(...values)
                                : null;

                            return (
                              <div
                                key={target}
                                style={{
                                  padding: 12,
                                  background: "#f8fafc",
                                  borderRadius: 8,
                                  border: "1px solid #e2e8f0"
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    marginBottom: 8
                                  }}
                                >
                                  {target.toUpperCase()}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#475569",
                                    lineHeight: 1.6
                                  }}
                                >
                                  <div>
                                    Média prevista:{" "}
                                    <strong>
                                      {avg != null
                                        ? avg.toFixed(2)
                                        : "—"}
                                    </strong>
                                  </div>
                                  <div>
                                    Mediana:{" "}
                                    <strong>
                                      {median != null
                                        ? median.toFixed(2)
                                        : "—"}
                                    </strong>
                                  </div>
                                  <div>
                                    Intervalo:{" "}
                                    <strong>
                                      {min != null
                                        ? min.toFixed(2)
                                        : "—"}{" "}
                                      a{" "}
                                      {max != null
                                        ? max.toFixed(2)
                                        : "—"}
                                    </strong>
                                  </div>
                                  <div>
                                    Previsões:{" "}
                                    <strong>{arr.length}</strong>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: 12,
                          background: "#f1f5f9",
                          borderRadius: 8,
                          color: "#64748b"
                        }}
                      >
                        Nenhuma previsão disponível ainda para este silo.
                      </div>
                    )}
                  </div>

                  <div>
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color: "#1f2937",
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      Análise textual e recomendações
                    </h4>
                    <div
                      style={{
                        padding: 16,
                        background: "#f0f9ff",
                        borderRadius: 8,
                        border: "1px solid #bfdbfe",
                        fontSize: 12,
                        color: "#1e3a8a",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        fontFamily: '"Monaco", "Courier New", monospace'
                      }}
                    >
                      {analysisExplanation ||
                        "Sem análise disponível para este período."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Silos simples */}
        {activeTab === "silos" && (
          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Silos</h3>
              {silos.length === 0 ? (
                <p>Nenhum silo cadastrado.</p>
              ) : (
                silos.map((silo) => (
                  <div
                    key={silo._id}
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb"
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{silo.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {typeof silo.location === "object"
                        ? `Lat: ${silo.location.lat}, Lng: ${silo.location.lng}`
                        : silo.location || "N/A"}{" "}
                      | Capacidade: {silo.capacity || "N/A"} ton
                    </div>
                  </div>
                ))
              )}
            </div>
            {isAdmin && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Criar Silo</h3>
                <div style={s.form}>
                  <input
                    style={s.input}
                    placeholder="Nome"
                    value={newSilo.name}
                    onChange={(e) =>
                      setNewSilo({ ...newSilo, name: e.target.value })
                    }
                  />
                  <input
                    style={s.input}
                    placeholder="Device ID"
                    value={newSilo.device_id}
                    onChange={(e) =>
                      setNewSilo({ ...newSilo, device_id: e.target.value })
                    }
                  />
                  <button style={s.button} onClick={createSilo}>
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leituras */}
        {activeTab === "leituras" && (
          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Leituras</h3>
              <div style={{ marginBottom: 12 }}>
                <select
                  style={s.select}
                  value={selectedSilo || ""}
                  onChange={(e) => setSelectedSilo(e.target.value)}
                >
                  <option value="">Selecione um silo</option>
                  {silos.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {readings.length === 0 ? (
                <p>Nenhuma leitura registrada.</p>
              ) : (
                readings.map((r) => (
                  <div
                    key={r._id}
                    style={{
                      padding: 6,
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 12
                    }}
                  >
                    {new Date(r.timestamp).toLocaleString("pt-BR")} - Temp:{" "}
                    {r.temp_C / 10}°C, Umid: {r.rh_pct / 10}%
                  </div>
                ))
              )}
            </div>
            {isAdmin && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Inserir leitura manual</h3>
                <div style={s.form}>
                  <input
                    style={s.input}
                    placeholder="Temperatura (°C * 10)"
                    value={newReading.temp_C}
                    onChange={(e) =>
                      setNewReading({ ...newReading, temp_C: e.target.value })
                    }
                  />
                  <input
                    style={s.input}
                    placeholder="Umidade (% * 10)"
                    value={newReading.rh_pct}
                    onChange={(e) =>
                      setNewReading({ ...newReading, rh_pct: e.target.value })
                    }
                  />
                  <button style={s.button} onClick={createReading}>
                    Salvar leitura
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alertas */}
        {activeTab === "alertas" && (
          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Alertas</h3>
              {alerts.length === 0 ? (
                <p>Nenhum alerta registrado.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert._id}
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 12
                    }}
                  >
                    <div>
                      <strong>{alert.level}</strong> - {alert.message}
                    </div>
                    <div>
                      Silo: {alert.silo_id} |{" "}
                      {new Date(alert.timestamp).toLocaleString("pt-BR")}
                    </div>
                    {!alert.acknowledged && (
                      <button
                        style={{ ...s.buttonSmall, marginTop: 4 }}
                        onClick={() => acknowledgeAlert(alert._id)}
                      >
                        Confirmar alerta
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Usuários */}
        {activeTab === "usuarios" && (
          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Usuários</h3>
              {users.length === 0 ? (
                <p>Nenhum usuário registrado.</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 12
                    }}
                  >
                    {user.username} - {user.email}
                  </div>
                ))
              )}
            </div>
            {isAdmin && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Criar usuário</h3>
                <div style={s.form}>
                  <input
                    style={s.input}
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                  />
                  <input
                    style={s.input}
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                  <input
                    style={s.input}
                    placeholder="Senha"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                  <button style={s.button} onClick={createUser}>
                    Salvar usuário
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </MainContent>
    </Container>
  );
}
