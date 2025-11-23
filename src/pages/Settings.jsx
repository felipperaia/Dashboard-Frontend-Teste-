import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import api from "../services/api";
import Notifications from './Notifications';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'operator' });
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("current_user");
    if (raw) setProfile(JSON.parse(raw));
    // if admin, fetch users
    try {
      const cu = JSON.parse(localStorage.getItem('current_user') || '{}');
      if (cu.role === 'admin') {
        api.get('/users').then(data => setUsers(data)).catch(() => {});
      }
    } catch(e){}
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/users/me`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });

      localStorage.setItem("current_user", JSON.stringify(profile));
      alert("Perfil atualizado com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    try {
      await api.post('/users', newUser);
      alert('Usuário criado');
      setNewUser({ username: '', email: '', password: '', role: 'operator' });
      const data = await api.get('/users'); setUsers(data);
    } catch(e) { console.error(e); alert('Erro ao criar usuário'); }
  }

  if (!profile) return <Panel>Carregando...</Panel>;

  return (
    <Panel>
      <Title>Configurações do Usuário</Title>

      <Form>
        <Label>
          Nome
          <Input
            name="name"
            value={profile.name || profile.username || ""}
            onChange={handleChange}
          />
        </Label>

        <Label>
          Email
          <Input
            name="email"
            value={profile.email || ""}
            onChange={handleChange}
          />
        </Label>

        <Label>
          Telefone
          <Input
            name="phone"
            value={profile.phone || ""}
            onChange={handleChange}
          />
        </Label>

        <ButtonsRow>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </PrimaryButton>

          <SecondaryButton onClick={() => navigate("/mfa") } $mfa>
            Configurar MFA
          </SecondaryButton>
        </ButtonsRow>
      </Form>

          {profile.role === 'admin' && (
        <div style={{marginTop:24}}>
          <h3>Gerenciar Usuários</h3>
          <div style={{display:'grid', gap:8}}>
            <input placeholder="Nome de usuário" value={newUser.username} onChange={e=>setNewUser({...newUser, username:e.target.value})} />
            <input placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} />
            <input placeholder="Senha" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} />
            <select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <PrimaryButton onClick={createUser}>Criar Usuário</PrimaryButton>
          </div>

          <div style={{marginTop:16}}>
            <h4>Usuários existentes</h4>
            <div>
              {users.map(u => (
                <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:8, borderBottom:'1px solid #eee'}}>
                  <div>
                    <div style={{fontWeight:600}}>{u.username}</div>
                    <div style={{fontSize:12,color:'#666'}}>{u.email} — {u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications embedded inside Settings (access via Settings only) */}
      <div style={{marginTop: 24}}>
        <Notifications />
      </div>
    </Panel>
  );
}

/* ----------------------------- STYLED COMPONENTS ----------------------------- */

const Panel = styled.div`
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 16px;
  max-width: 720px;
  margin: 14px auto;
  color: #06202a;
  box-shadow: 0 6px 18px rgba(2,6,23,0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(2,6,23,0.12);
  }
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 700;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-size: 14px;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Input = styled.input`
  padding: 10px;
  background: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #858282;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: #a78bfa;
    background: rgba(255, 255, 255, 0.12);
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
`;

const PrimaryButton = styled.button`
  flex: 1;
  padding: 10px;
  background: #16a34a; /* green primary */
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;

  &:hover {
    transform: translateY(-2px);
    background: #15803d;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  flex: 1;
  padding: 10px;
  background: #2563eb; /* blue for MFA */
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 8px;
  color: white;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;

  &:hover {
    transform: translateY(-2px);
    background: #1e40af;
  }
`;
