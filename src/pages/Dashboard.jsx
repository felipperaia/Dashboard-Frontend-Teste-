import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSilo, setSelectedSilo] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newSilo, setNewSilo] = useState({ name: "", device_id: "", latitude: "", longitude: "", capacity: "" });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "" });
  const [newReading, setNewReading] = useState({ silo_id: "", temp_C: "", rh_pct: "", co2_ppm_est: "", mq2_raw: "", luminosity_alert: 0, lux: "" });
  
const [authToken, setAuthToken] = useState(() => localStorage.getItem("access_token"));

  const API_BASE = "https://dashboard-backend-teste.onrender.com";
  const getHeaders = () => ({
    "Authorization": `Bearer ${authToken}`,
    "Content-Type": "application/json"
  });

  const fetchSilos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/silos/`, { headers: getHeaders() });
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

  const createSilo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/silos/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newSilo)
      });
      if (!res.ok) throw new Error("Erro ao criar silo");
      alert("Silo criado!");
      setNewSilo({ name: "", device_id: "", latitude: "", longitude: "", capacity: "" });
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

  const fetchReadings = async (siloId) => {
    try {
      setLoading(true);
      const url = siloId ? `${API_BASE}/api/readings?silo_id=${siloId}&limit=100` : `${API_BASE}/api/readings?limit=100`;
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

  const createReading = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/readings/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newReading,
          temp_C: parseFloat(newReading.temp_C),
          rh_pct: parseFloat(newReading.rh_pct),
          co2_ppm_est: newReading.co2_ppm_est ? parseFloat(newReading.co2_ppm_est) : undefined,
          mq2_raw: newReading.mq2_raw ? parseInt(newReading.mq2_raw) : undefined,
          luminosity_alert: typeof newReading.luminosity_alert !== 'undefined' ? newReading.luminosity_alert : undefined,
          lux: newReading.lux ? parseFloat(newReading.lux) : undefined
        })
      });
      if (!res.ok) throw new Error("Erro ao criar leitura");
      alert("Leitura criada!");
      setNewReading({ silo_id: "", temp_C: "", rh_pct: "", co2_ppm_est: "", mq2_raw: "", luminosity_alert: 0, lux: "" });
      fetchReadings(selectedSilo);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Erro ao buscar alertas");
      const data = await res.json();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports?limit=50`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar relatórios');
      const data = await res.json();
      setReports(data || []);
    } catch (e) {
      console.warn('fetchReports erro', e);
    }
  };

  const fetchForecastsForSilo = async (siloId) => {
    try {
      if (!siloId) return;
      const res = await fetch(`${API_BASE}/api/ml/forecast?siloId=${siloId}&period_days=7`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar previsões');
      const data = await res.json();
      setForecasts(data || []);
    } catch (e) {
      console.warn('fetchForecastsForSilo erro', e);
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

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
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

  const subscribeNotifications = async () => {
    try {
      const vapidRes = await fetch(`${API_BASE}/api/notifications/vapid_public`, { headers: getHeaders() });
      const vapidData = await vapidRes.json();
      alert("VAPID Key obtida: " + vapidData.public_key);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  useEffect(() => {
    fetchSilos();
    fetchAlerts();
    fetchUsers();
    fetchReports();

    // poll reports and meteorology periodically
    const repInterval = setInterval(() => fetchReports(), 60 * 1000);
    return () => clearInterval(repInterval);
  }, []);

  // Auto-load meteorology when entering the Report tab or when silo changes
  useEffect(() => {
    // Always auto-load meteorology when in Report tab; if selectedSilo use silo-specific, otherwise load recent docs
    let mounted = true;
    const doLoad = async () => {
      try {
        const url = selectedSilo ? `${API_BASE}/api/weather/latest?silo_id=${selectedSilo}` : `${API_BASE}/api/weather/latest?limit=10`;
        const res = await fetch(url, { headers: getHeaders() });
        if (res.ok && mounted) {
          const data = await res.json();
          setMeteorology(data || []);
        }
      } catch (e) {
        console.warn('Erro ao carregar meteorologia automaticamente', e);
      }
    };

    if (activeTab === 'report') {
      doLoad();
      // poll meteorology every 2 minutes while on report tab
      const iv = setInterval(doLoad, 2 * 60 * 1000);
      // also refresh forecasts
      fetchForecastsForSilo(selectedSilo);
      return () => { mounted = false; clearInterval(iv); };
    }
  }, [activeTab, selectedSilo]);

  // usuário atual (para regras de exibição por role)
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('current_user') || '{}'); } catch { return {}; }
  })();
  const isAdmin = currentUser && currentUser.role === 'admin';

  useEffect(() => {
    if (selectedSilo) fetchReadings(selectedSilo);
  }, [selectedSilo]);

  const readingsBySilo = readings.reduce((acc, r) => {
    if (!r.silo_id) return acc;
    if (!acc[r.silo_id]) acc[r.silo_id] = [];
    acc[r.silo_id].push(r);
    return acc;
  }, {});

  // Calculate averages and trends
  const calculateMetrics = () => {
    if (!readings.length) return { avgTemp: 0, avgHumidity: 0, tempTrend: "stable", humTrend: "stable" };
    
    const recent = readings.slice(-10);
    const older = readings.slice(-20, -10);
    
    const avgTemp = recent.reduce((sum, r) => sum + (r.temp_C / 10), 0) / recent.length;
    
    const avgHumidity = recent.reduce((sum, r) => sum + (r.rh_pct / 10 ), 0) / recent.length;
    
    const oldAvgTemp = older.length ? older.reduce((sum, r) => sum + r.temp_C, 0) / older.length : avgTemp;
    const oldAvgHum = older.length ? older.reduce((sum, r) => sum + r.rh_pct, 0) / older.length : avgHumidity;
    
    const tempTrend = avgTemp > oldAvgTemp ? "up" : avgTemp < oldAvgTemp ? "down" : "stable";
    const humTrend = avgHumidity > oldAvgHum ? "up" : avgHumidity < oldAvgHum ? "down" : "stable";
    
    return { avgTemp: avgTemp.toFixed(1), avgHumidity: avgHumidity.toFixed(1), tempTrend, humTrend };
  };
  

  const metrics = calculateMetrics();

  const prepareChartData = () => {
    if (!selectedSilo || !readingsBySilo[selectedSilo]) return { labels: [], datasets: [] };
    const siloReadings = [...readingsBySilo[selectedSilo]].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-20);
    return {
      labels: siloReadings.map(r => new Date(r.timestamp).toLocaleTimeString()),
      datasets: [
        { label: "Temperatura (°C)", data: siloReadings.map(r => r.temp_C), borderColor: "rgb(239,68,68)", backgroundColor: "rgba(239,68,68,0.1)", yAxisID: "y", tension: 0.4 },
        { label: "Umidade (%)", data: siloReadings.map(r => r.rh_pct), borderColor: "rgb(59,130,246)", backgroundColor: "rgba(59,130,246,0.1)", yAxisID: "y1", tension: 0.4 }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: { 
      legend: { position: "top", labels: { font: { size: 12 }, padding: 15 } }, 
      title: { display: true, text: "Monitoramento em Tempo Real", font: { size: 16 } } 
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { type: "linear", display: true, position: "left", grid: { color: "rgba(0,0,0,0.05)" } },
      y1: { type: "linear", display: true, position: "right", grid: { drawOnChartArea: false } }
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  const unreadAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <Container>
      {/* Left Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
        </div>

        {/* Metric Cards */}
        <div style={s.metricCard}>
          <div style={s.metricHeader}>
            <span style={s.metricLabel}>Temperatura Média</span>
            <span style={s.trendIcon}>{getTrendIcon(metrics.tempTrend)}</span>
          </div>
          <div style={s.metricValue}>
            <span style={s.metricNumber}>{metrics.avgTemp}</span>
            <span style={s.metricUnit}>°C</span>
          </div>
          <div style={s.metricBar}>
            <div style={{...s.metricBarFill, width: `${Math.min(100, (metrics.avgTemp/40)*100)}%`, background: "linear-gradient(90deg, #ef4444, #f97316)"}}></div>
          </div>
        </div>

        <div style={s.metricCard}>
          <div style={s.metricHeader}>
            <span style={s.metricLabel}>Umidade Média</span>
            <span style={s.trendIcon}>{getTrendIcon(metrics.humTrend)}</span>
          </div>
          <div style={s.metricValue}>
            <span style={s.metricNumber}>{metrics.avgHumidity}</span>
            <span style={s.metricUnit}>%</span>
          </div>
          <div style={s.metricBar}>
            <div style={{...s.metricBarFill, width: `${metrics.avgHumidity}%`, background: "linear-gradient(90deg, #3b82f6, #06b6d4)"}}></div>
          </div>
        </div>

        <div style={s.metricCard}>
          <div style={s.metricHeader}>
            <span style={s.metricLabel}>Tendências (24h)</span>
          </div>
          <div style={s.trendsContainer}>
            <div style={s.trendItem}>
              <span style={s.trendLabel}>Temp:</span>
              <span style={{...s.trendValue, color: metrics.tempTrend === "up" ? "#ef4444" : "#10b981"}}>
                {metrics.tempTrend === "up" ? "Subindo" : metrics.tempTrend === "down" ? "Caindo" : "Estável"}
              </span>
            </div>
            <div style={s.trendItem}>
              <span style={s.trendLabel}>Umid:</span>
              <span style={{...s.trendValue, color: metrics.humTrend === "up" ? "#3b82f6" : "#10b981"}}>
                {metrics.humTrend === "up" ? "Subindo" : metrics.humTrend === "down" ? "Caindo" : "Estável"}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{...s.metricCard, background: unreadAlerts.length > 0 ? "linear-gradient(135deg, #fef3c7, #fed7aa)" : "#fff"}}>
          <div style={s.metricHeader}>
            <span style={s.metricLabelNot}>Notificações</span>
            {unreadAlerts.length > 0 && <span style={s.badge}>{unreadAlerts.length}</span>}
          </div>
          <div style={s.notificationList}>
            {unreadAlerts.length === 0 ? (
              <p style={s.noNotifications}>Sem alertas ativos</p>
            ) : (
              unreadAlerts.slice(0, 3).map((alert, i) => (
                <div key={i} style={s.notificationItem}>
                  <span style={s.notificationText}>{alert.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Card */}
        <div style={s.infoCard}>
          <div style={s.infoIcon}></div>
          <p style={s.infoText}>
            Monitorar temperatura e umidade dos silos é crítico para prevenir fermentação, perda de qualidade e risco de autoaquecimento. 
            Ajuste ventilação e períodos de rechecagem sempre que os valores estiverem fora da faixa operacional recomendada.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <MainContent>
        <div style={s.header}>
          <div style={s.headerActions}>
          </div>
        </div>
        
        <Tabs>
          {[
            {k: 'dashboard', label: 'Dashboard'},
            {k: 'simplified', label: 'Dashboard Simplificado'},
            {k: 'silos', label: 'Silos'},
            {k: 'readings', label: 'Leituras'},
            {k: 'alerts', label: 'Alertas'},
            {k: 'report', label: 'Relatório'}
          ].map(tab => (
            <button key={tab.k} style={activeTab === tab.k ? s.tabActive : s.tab} onClick={() => setActiveTab(tab.k)}>
              {tab.label}
            </button>
          ))}
        </Tabs>

        {activeTab === "dashboard" && (
          <div>
            {loading ? <div style={s.loading}>Carregando...</div> : error ? <div style={s.error}>{error}</div> : (
              <>
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Seleção de Silo</h3>
                  </div>
                  <select style={s.select} value={selectedSilo || ""} onChange={(e) => setSelectedSilo(e.target.value)}>
                    <option value="">Todos os Silos</option>
                    {silos.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                
                {selectedSilo && readingsBySilo[selectedSilo] && readingsBySilo[selectedSilo].length > 0 && (
                  <div style={s.card}>
                    <Line data={prepareChartData()} options={chartOptions} />
                  </div>
                )}
                
                <div style={s.statsGrid}>
                  <div style={s.statCard}>
                    <div style={s.statIcon}></div>
                    <h3 style={s.statTitle}>Total de Silos</h3>
                    <p style={s.statNumber}>{silos.length}</p>
                  </div>
                  <div style={{...s.statCard, background: unreadAlerts.length > 0 ? "linear-gradient(135deg, #fef3c7, #fed7aa)" : "linear-gradient(135deg, #f3f4f6, #ffffff)"}}>
                    <div style={s.statIcon}></div>
                    <h3 style={s.statTitle}>Alertas Ativos</h3>
                    <p style={{...s.statNumber, color: unreadAlerts.length > 0 ? "#f59e0b" : "#10b981"}}>{unreadAlerts.length}</p>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statIcon}></div>
                    <h3 style={s.statTitle}>Leituras Hoje</h3>
                    <p style={s.statNumber}>{readings.length}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "simplified" && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap:20}}>
              {[{
                key: 'temp', title: 'Temperatura', icon: '/src/assets/icons/thermometer.svg', value: readings.length ? (readings[readings.length-1].temp_C ?? 0) : 0, unit: '°C', gradient: 'linear-gradient(90deg, #ef4444, #f97316)'
              },{
                key: 'hum', title: 'Umidade', icon: '/src/assets/icons/humidity.svg', value: readings.length ? (readings[readings.length-1].rh_pct ?? 0) : 0, unit: '%', gradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)'
              },{
                key: 'co2', title: 'CO²', icon: '/src/assets/icons/co2.svg', value: readings.length ? (readings[readings.length-1].co2_ppm_est ?? 0) : 0, unit: 'ppm', gradient: 'linear-gradient(90deg, #64748b, #94a3b8)'
              },{
                key: 'gas', title: 'Gases inflamáveis', icon: '/src/assets/icons/gas.svg', value: readings.length ? (readings[readings.length-1].mq2_raw ?? 0) : 0, unit: '', gradient: 'linear-gradient(90deg, #f97316, #ef4444)'
              },{
                key: 'light', title: 'Luminosidade', icon: '/src/assets/icons/light.svg', value: readings.length ? (readings[readings.length-1].lux ?? 0) : 0, unit: 'lux', gradient: 'linear-gradient(90deg, #facc15, #f97316)'
              }].map(metric => (
                <div key={metric.key} style={{...s.card, display:'flex', flexDirection:'column', alignItems:'flex-start', background: '#000', color:'#fff'}}>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <img src={metric.icon} alt={metric.title} style={{width:28,height:28, filter:'invert(1)'}} />
                    <h4 style={{margin:0, color:'#fff'}}>{metric.title}</h4>
                  </div>
                  <div style={{marginTop:12, display:'flex', alignItems:'baseline', gap:8}}>
                    <span style={{fontSize:28, fontWeight:700, color:'#fff'}}>{metric.value}</span>
                    <span style={{color:'#cbd5e1'}}>{metric.unit}</span>
                  </div>
                  <div style={{width:'100%', height:8, marginTop:12, background:'#f1f5f9', borderRadius:6}}>
                    <div style={{height:'100%', width:`${Math.min(100, (metric.unit==='°C' ? Math.abs(metric.value) : (metric.unit==='%' ? metric.value : (metric.unit==='lux' ? Math.min(100, metric.value) : 50))))}%`, background: metric.gradient, borderRadius:6}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <div style={s.card}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Relatórios Gerados</h3>
                  </div>
                  <div>
                    {reports.length === 0 ? <p>Nenhum relatório carregado.</p> : (
                      <div style={{display:'grid', gap:10}}>
                        {reports.map(r => (
                          <div key={r._id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:10, borderRadius:8, background:'#fff'}}>
                            <div>
                              <div style={{fontWeight:700}}>{r.title}</div>
                              <div style={{fontSize:12, color:'#64748b'}}>Silo: {r.silo_name} | Período: {new Date(r.start).toLocaleDateString()} - {new Date(r.end).toLocaleDateString()}</div>
                              {r.spark_metrics && Object.keys(r.spark_metrics).length > 0 && (
                                <div style={{marginTop:6, fontSize:12}}>
                                  {Object.entries(r.spark_metrics).map(([t,g]) => (
                                    <div key={t} style={{color:'#374151'}}>{t}: cnt {g.count} • avg {g.avg ? Number(g.avg).toFixed(2) : 'n/a'}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{display:'flex', gap:8}}>
                              <a href={`${API_BASE}/api/reports/${r._id}/pdf`} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><button style={s.buttonSmall}>Baixar PDF</button></a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            </div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Gerar Novo Relatório</h3>
                <div>
                  <select style={s.select} value={selectedSilo || ""} onChange={(e) => setSelectedSilo(e.target.value)}>
                    <option value="">Selecione o Silo</option>
                    {silos.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
                <div style={s.form}>
                  <input type="date" style={s.input} value={reportStart} onChange={(e)=>setReportStart(e.target.value)} />
                  <input type="date" style={s.input} value={reportEnd} onChange={(e)=>setReportEnd(e.target.value)} />
                  <input style={s.input} placeholder="Título (opcional)" value={reportTitle} onChange={(e)=>setReportTitle(e.target.value)} />
                  <textarea style={{...s.input, minHeight:80}} placeholder="Notas" value={reportNotes} onChange={(e)=>setReportNotes(e.target.value)} />
                  <div style={{display:'flex', gap:8}}>
                    <button style={s.button} onClick={async ()=>{
                      if(!selectedSilo){ alert('Selecione um silo'); return; }
                      try{
                        const body = { silo_id: selectedSilo, start: new Date(reportStart).toISOString(), end: new Date(reportEnd).toISOString(), title: reportTitle, notes: reportNotes };
                        const res = await fetch(`${API_BASE}/api/reports/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
                        if(!res.ok) throw new Error('Erro ao gerar relatório');
                        const created = await res.json();
                        // abrir PDF
                        window.open(`${API_BASE}/api/reports/${created._id}/pdf`, '_blank');
                      }catch(e){ alert('Erro ao gerar relatório: ' + e.message) }
                    }}>Gerar Relatório (PDF)</button>
                    <div style={{flex:1}} />
                  </div>
                </div>
              {meteorology.length > 0 && (
                <div style={{marginTop:12}}>
                  <h4>Previsão Meteorológica (7 dias)</h4>
                  {(() => {
                    const m = meteorology[0];
                    const daily = (m && m.data && m.data.daily) ? m.data.daily : null;
                    if (!daily) return <div>Nenhuma previsão disponível.</div>;
                    const times = daily.time || [];
                    const tmax = daily.temperature_2m_max || [];
                    const tmin = daily.temperature_2m_min || [];
                    const precip = daily.precipitation_sum || [];

                    const allTemps = [...tmax, ...tmin].filter(v => typeof v === 'number');
                    const minTemp = allTemps.length ? Math.min(...allTemps) : 0;
                    const maxTemp = allTemps.length ? Math.max(...allTemps) : 1;

                    const renderSpark = (vals) => {
                      if (!vals || !vals.length) return null;
                      const w = 120, h = 36, pad = 4;
                      const step = (w - pad*2) / Math.max(1, vals.length - 1);
                      const norm = (v) => {
                        if (maxTemp === minTemp) return h/2;
                        return h - pad - ((v - minTemp) / (maxTemp - minTemp)) * (h - pad*2);
                      };
                      const points = vals.map((v, i) => `${pad + i*step},${norm(v)}`).join(' ');
                      return (
                        <svg width={w} height={h} style={{display:'block'}}>
                          <polyline points={points} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      );
                    };

                    return (
                      <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap:12}}>
                        {times.slice(0,7).map((t, i) => (
                          <div key={i} style={{padding:12, background:'#fff', borderRadius:8, border:'1px solid #e6eef6'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                              <div style={{fontSize:13, fontWeight:600}}>{new Date(t).toLocaleDateString()}</div>
                              <div style={{fontSize:12, color:'#64748b'}}>{precip[i] ? `${precip[i]} mm` : '—'}</div>
                            </div>
                            <div style={{display:'flex', gap:8, alignItems:'center'}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:20, fontWeight:700, color:'#ef4444'}}>{tmax[i] ?? '—'}°</div>
                                <div style={{fontSize:12, color:'#64748b'}}>mín {tmin[i] ?? '—'}°</div>
                              </div>
                              <div style={{width:120}}>
                                {renderSpark(tmax.slice(0,7))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              {forecasts.length > 0 && (
                <div style={{marginTop:12}}>
                  <h4>Previsões geradas</h4>
                  <div style={{display:'grid', gap:8}}>
                    {forecasts.map((f, i) => (
                      <div key={i} style={{padding:8, borderRadius:8, background:'#fff'}}>
                        <div><strong>{f.target}</strong> | horizonte: {f.horizon_hours}h | valor: {f.value_predicted}</div>
                        <div style={{fontSize:12, color:'#64748b'}}>forecast_at: {new Date(f.timestamp_forecast).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "silos" && (
          <div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Criar Novo Silo</h3>
              </div>
              <div style={s.form}>
                <input style={s.input} placeholder="Nome do Silo" value={newSilo.name} onChange={(e) => setNewSilo({...newSilo, name: e.target.value})} />
                <input style={s.input} placeholder="Device ID (ThingSpeak)" value={newSilo.device_id} onChange={(e) => setNewSilo({...newSilo, device_id: e.target.value})} />
                <div style={{display:'flex', gap:8}}>
                  <input style={{...s.input, flex:1}} type="number" step="0.000001" placeholder="Latitude" value={newSilo.latitude} onChange={(e) => setNewSilo({...newSilo, latitude: e.target.value})} />
                  <input style={{...s.input, flex:1}} type="number" step="0.000001" placeholder="Longitude" value={newSilo.longitude} onChange={(e) => setNewSilo({...newSilo, longitude: e.target.value})} />
                </div>
                <input style={s.input} type="number" placeholder="Capacidade (toneladas)" value={newSilo.capacity} onChange={(e) => setNewSilo({...newSilo, capacity: e.target.value})} />
                <button style={{...s.buttonSmall, marginTop:4}} onClick={async ()=>{
                  if (!navigator.geolocation) { alert('Geolocalização não suportada pelo navegador'); return; }
                  navigator.geolocation.getCurrentPosition((pos)=>{
                    setNewSilo({...newSilo, latitude: pos.coords.latitude, longitude: pos.coords.longitude});
                    alert('Latitude/Longitude preenchidos com sucesso');
                  }, (err)=>{ alert('Permissão negada ou erro: ' + err.message); });
                }}>Preencher com localização atual</button>
                <button style={s.button} onClick={createSilo}>Criar Silo</button>
              </div>
            </div>
            
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Lista de Silos</h3>
              </div>
              <div style={s.list}>
                {silos.map(silo => (
                  <div key={silo._id} style={s.listItem}>
                    <div>
                      <strong style={s.listTitle}>{silo.name}</strong>
                      <p style={s.listSubtext}>
                        {typeof silo.location === 'object' 
                          ? `Lat: ${silo.location.lat}, Lng: ${silo.location.lng}` 
                          : (silo.location || "N/A")} | Capacidade: {silo.capacity || "N/A"} ton
                      </p>
                    </div>
                    <button style={s.buttonSmall} onClick={() => {
                      const temp = prompt("Temperatura máxima (°C):");
                      const humidity = prompt("Umidade máxima (%):");
                      if (temp && humidity) updateSiloSettings(silo._id, { max_temp: parseFloat(temp), max_humidity: parseFloat(humidity) });
                    }}>Configurar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "readings" && (
          <div>
            {isAdmin ? (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitle}>Adicionar Leitura Manual</h3>
                </div>
                <div style={s.form}>
                  <select style={s.select} value={newReading.silo_id} onChange={(e) => setNewReading({...newReading, silo_id: e.target.value})}>
                    <option value="">Selecione o Silo</option>
                    {silos.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <input style={s.input} type="number" step="0.1" placeholder="Temperatura (°C)" value={newReading.temp_C} onChange={(e) => setNewReading({...newReading, temp_C: e.target.value})} />
                  <input style={s.input} type="number" step="0.1" placeholder="Umidade (%)" value={newReading.rh_pct} onChange={(e) => setNewReading({...newReading, rh_pct: e.target.value})} />
                  <input style={s.input} type="number" step="0.1" placeholder="CO² (ppm)" value={newReading.co2_ppm_est} onChange={(e) => setNewReading({...newReading, co2_ppm_est: e.target.value})} />
                  <input style={s.input} type="number" step="1" placeholder="MQ2 (raw)" value={newReading.mq2_raw} onChange={(e) => setNewReading({...newReading, mq2_raw: e.target.value})} />
                  <div style={{display:'flex', gap:8}}>
                    <input style={{...s.input, flex:1}} type="number" step="0.1" placeholder="Lux" value={newReading.lux} onChange={(e) => setNewReading({...newReading, lux: e.target.value})} />
                    <select style={{...s.select, width:120}} value={newReading.luminosity_alert || 0} onChange={(e) => setNewReading({...newReading, luminosity_alert: parseInt(e.target.value)})}>
                      <option value={0}>Flag Lum.</option>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                  </div>
                  <button style={s.button} onClick={createReading}>Adicionar Leitura</button>
                </div>
              </div>
            ) : (
              <div style={s.card}><p>Somente administradores podem inserir leituras manuais.</p></div>
            )}
            
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Últimas Leituras</h3>
              </div>
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span>Silo</span><span>Temperatura</span><span>Umidade</span><span>Data/Hora</span>
                </div>
                {readings.slice(0, 20).map((reading, idx) => (
                  <div key={idx} style={s.tableRow}>
                    <span style={{color: "#000"}}>{silos.find(sl => sl._id === reading.silo_id)?.name || reading.silo_id}</span>
                    <span style={{color: reading.temp_C > 30 ? "#ef4444" : "#10b981"}}>{reading.temp_C}°C</span>
                    <span style={{color: reading.rh_pct > 70 ? "#3b82f6" : "#10b981"}}>{reading.rh_pct}%</span>
                    <span style={{color: "#000"}}>{new Date(reading.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Alertas do Sistema</h3>
              <button style={s.buttonSmall} onClick={fetchAlerts}>Atualizar</button>
            </div>
            <div style={s.list}>
              {alerts.length === 0 ? <p style={s.emptyState}>Nenhum alerta registrado</p> : alerts.map(alert => (
                <div key={alert._id} style={{...s.listItem, background: alert.acknowledged ? "#f9fafb" : "#fef3c7"}}>
                  <div>
                    <strong style={s.listTitle}>{alert.message}</strong>
                    <p style={s.listSubtext}> Silo: {alert.silo_id} |  {new Date(alert.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                  {!alert.acknowledged && <button style={s.buttonSuccess} onClick={() => acknowledgeAlert(alert._id)}>✓ Confirmar</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Criar Novo Usuário</h3>
              </div>
              <div style={s.form}>
                <input style={s.input} placeholder="Nome de Usuário" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                <input style={s.input} type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                <input style={s.input} type="password" placeholder="Senha" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                <button style={s.button} onClick={createUser}>Criar Usuário</button>
              </div>
            </div>
            
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Lista de Usuários</h3>
                <button style={s.buttonSmall} onClick={fetchUsers}>Atualizar</button>
              </div>
              <div style={s.list}>
                {users.map(user => (
                  <div key={user._id} style={s.listItem}>
                    <div>
                      <strong style={s.listTitle}>{user.username}</strong>
                      <p style={s.listSubtext}>{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Notificações Push</h3>
              </div>
              <p style={s.cardDescription}>Ative as notificações para receber alertas em tempo real sobre condições críticas dos silos.</p>
              <button style={s.button} onClick={subscribeNotifications}>Ativar Notificações</button>
            </div>
          </div>
        )}
      </MainContent>
    </Container>
      
  );
}

const s = {
  container: { 
    display: "flex", 
    minHeight: "100vh", 
    
  },
  sidebar: {
    width: 380,
    background: "transparent",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  logo: {
    marginBottom: 10
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    margin: 0
  },
  metricCard: {
    background: "#ffffff22",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 13,
    color: "#e6e6e6",
    fontWeight: "500"
  },
    metricLabelNot: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500"
  },
  trendIcon: {
    fontSize: 18,
    color: "#94b896"
  },
  metricValue: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#26a84f"
  },
  metricUnit: {
    fontSize: 14,
    color: "#dadada"
  },
  metricBar: {
    height: 6,
    background: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden"
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease"
  },
  trendsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  trendItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  trendLabel: {
    fontSize: 12,
    color: "#e2e2e2"
  },
  trendValue: {
    fontSize: 12,
    fontWeight: "600"
  },
  notificationList: {
    marginTop: 10
  },
  noNotifications: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    margin: 0
  },
  notificationItem: {
    padding: 8,
    background: "#fef3c7",
    borderRadius: 6,
    marginBottom: 6
  },
  notificationText: {
    fontSize: 11,
    color: "#92400e"
  },
  badge: {
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 10,
    fontWeight: "bold"
  },
  infoCard: {
    background: "#ffffff22",
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  infoText: {
    fontSize: 12,
    color: "#1eaf5f",
    lineHeight: 1.5,
    margin: 0
  },
  mainContent: {
    flex: 1,
    padding: 30,
    overflowY: "auto",
    width: "70vw"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 15
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500"
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 25,
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: 2,
    justifyContent: "end"

  },
  tab: {
    padding: "12px 24px",
    background: "transparent",
    border: "none",
    color: "#ececec",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "500",
    borderRadius: "8px 8px 0 0",
    transition: "all 0.2s ease"
  },
  tabActive: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #258f3f, #269c4a)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "600",
    borderRadius: "8px 8px 0 0",
    boxShadow: "0 2px 8px rgba(59,130,246,0.3)"
  },
  card: {
    background: "#fffffff0",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
    border: "1px solid #e2e8f0"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 1.5
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  input: {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    transition: "border-color 0.2s ease",
    outline: "none"
  },
  select: {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
    outline: "none"
  },
  button: {
    padding: "12px 24px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    margin: 'auto',
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 14,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
  },
  buttonSmall: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "500",
    transition: "transform 0.2s ease"
  },
  buttonSuccess: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #23a378, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "500"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  listItem: {
    padding: 16,
    background: "#f9fafb",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  listTitle: {
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 4
  },
  listSubtext: {
    fontSize: 12,
    color: "#64748b",
    margin: 0
  },
  table: {
    marginTop: 15
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
    gap: 10,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    fontWeight: "600",
    fontSize: 13,
    color: "#475569",
    borderRadius: "8px 8px 0 0",
    borderBottom: "2px solid #e2e8f0"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    transition: "background 0.2s ease"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 20
  },
  statCard: {
    background: "#ffffff22",
    padding: 24,
    borderRadius: 16,
    textAlign: "center",
    border: "1px solid #e5e7eb",
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 12
  },
  statTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500"
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#479447",
    margin: 0
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "#64748b",
    fontSize: 16
  },
  error: {
    padding: 20,
    color: "#ef4444",
    textAlign: "center",
    background: "#fee2e2",
    borderRadius: 8,
    border: "1px solid #fecaca"
  },
  emptyState: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 40,
    fontSize: 14
  }
}

import styled from "styled-components";

const Container = styled.div`
  display: flex;
  min-height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled.div` 
    flex: 1;
    padding: 30;
    overflow-Y: "auto";
    width: 70vw;
    
     @media (max-width: 768px) {
    flex: 1;
    margin: auto;
    overflow-Y: "auto";
    width: 80vw;
    
  }
`

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
      padding: 8px 12px!important;
    }
  }
`;