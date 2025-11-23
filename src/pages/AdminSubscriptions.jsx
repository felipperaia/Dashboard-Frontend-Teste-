import React, { useEffect, useState } from "react";
import api from "../services/api"; // ✅ CORREÇÃO: Importação sem chaves
/*
 AdminSubscriptions.jsx
 Página admin simples para listar push_subscriptions e permitir remoção.
 Requer que o usuário autenticado seja admin (backend valida).
*/

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminListSubscriptions();
      setSubs(data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=> { fetchSubs(); }, []);

  const remove = async (endpoint) => {
    if (!confirm("Remover subscription?")) return;
    try {
      await api.unsubscribe(endpoint);
      // atualizar lista
      fetchSubs();
    } catch (e) {
      alert("Falha ao remover: " + (e.message || e));
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Subscriptions (admin)</h2>
      {loading && <div>Carregando...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && subs.length === 0 && <div>Não há subscriptions.</div>}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>endpoint</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>user_id</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>silo_id</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>created_at</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {subs.map(s => (
            <tr key={s.id}>
              <td style={{ padding: "8px 4px" }}>{s.id}</td>
              <td style={{ padding: "8px 4px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{s.endpoint}</td>
              <td style={{ padding: "8px 4px" }}>{s.user_id}</td>
              <td style={{ padding: "8px 4px" }}>{s.silo_id || "—"}</td>
              <td style={{ padding: "8px 4px" }}>{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</td>
              <td style={{ padding: "8px 4px" }}><button onClick={()=>remove(s.endpoint)}>Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
