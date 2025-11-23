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
  const [activeTab, setActiveTab] = useState('perfil');
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
    <SettingsContainer>
      <HeaderRow>
        <Title>Configurações</Title>
        <Tabs>
          <TabButton $active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')}>Perfil</TabButton>
          {profile.role === 'admin' && <TabButton $active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')}>Usuários</TabButton>}
          <TabButton $active={activeTab === 'notificacoes'} onClick={() => setActiveTab('notificacoes')}>Notificações</TabButton>
        </Tabs>
      </HeaderRow>

      {activeTab === 'perfil' && (
        <CardGrande>
          <CardHeader>
            <h3 style={{margin:0, color:'#1e293b'}}>Configurações do Usuário</h3>
            <div>
              <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</PrimaryButton>
            </div>
          </CardHeader>
          <CardBody>
            <Section>
              <Label>Nome
                <Input name="name" value={profile.name || profile.username || ""} onChange={handleChange} />
              </Label>
            </Section>

            <Section>
              <Label>Email
                <Input name="email" value={profile.email || ""} onChange={handleChange} />
              </Label>
            </Section>

            <Section>
              <Label>Telefone
                <Input name="phone" value={profile.phone || ""} onChange={handleChange} />
              </Label>
            </Section>

            <SectionRow>
              <SecondaryButton onClick={() => navigate('/mfa')}>Configurar MFA</SecondaryButton>
            </SectionRow>
          </CardBody>
        </CardGrande>
      )}

      {activeTab === 'usuarios' && profile.role === 'admin' && (
        <CardGrande>
          <CardHeader>
            <h3 style={{margin:0, color:'#1e293b'}}>Gerenciar Usuários</h3>
          </CardHeader>
          <CardBody>
            <Section>
              <Label>Nome de usuário
                <Input value={newUser.username} onChange={(e)=>setNewUser({...newUser, username:e.target.value})} />
              </Label>
            </Section>

            <Section>
              <Label>Email
                <Input value={newUser.email} onChange={(e)=>setNewUser({...newUser, email:e.target.value})} />
              </Label>
            </Section>

            <Section>
              <Label>Senha
                <Input type="password" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password:e.target.value})} />
              </Label>
            </Section>

            <Section>
              <Label>Função
                <Select value={newUser.role} onChange={(e)=>setNewUser({...newUser, role:e.target.value})}>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </Select>
              </Label>
            </Section>

            <ButtonsRow>
              <PrimaryButton onClick={createUser}>Criar Usuário</PrimaryButton>
            </ButtonsRow>

            <Section style={{marginTop:12}}>
              <h4 style={{color:'#1e293b'}}>Usuários existentes</h4>
              <div>
                {users.map(u => (
                  <UserRow key={u.id}>
                    <div>
                      <div style={{fontWeight:600, color:'#111827'}}>{u.username}</div>
                      <div style={{fontSize:12,color:'#4b5563'}}>{u.email} — {u.role}</div>
                    </div>
                  </UserRow>
                ))}
              </div>
            </Section>
          </CardBody>
        </CardGrande>
      )}

      {activeTab === 'notificacoes' && (
        <CardGrande>
          <CardHeader>
            <h3 style={{margin:0, color:'#1e293b'}}>Notificações</h3>
          </CardHeader>
          <CardBody>
            <Section>
              <Notifications />
            </Section>
          </CardBody>
        </CardGrande>
      )}
    </SettingsContainer>
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

const SettingsContainer = styled.div`
  padding: 24px;
  max-width: 1100px;
  margin: 12px auto;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.94);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(2,6,23,0.06);
  border: 1px solid #e6eef6;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 14px 32px rgba(2,6,23,0.10);
  }
`;

const CardHeader = styled.div`
  display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
`;

const CardBody = styled.div`
  display:flex; flex-direction:column; gap:10px;
`;

const Section = styled.div`
  padding:10px; border-radius:10px;
  transition: transform 0.12s ease, background 0.12s ease;
  &:hover { transform: translateY(-4px); background: #fbfdff; }
`;

const SectionRow = styled.div`
  display:flex; gap:8px; align-items:center;
`;

const UserRow = styled.div`
  padding:8px; border-radius:8px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:12px;
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
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Input = styled.input`
  padding: 12px;
  background: #f1f5f9;
  border: 1px solid rgba(148,163,184,0.4);
  border-radius: 10px;
  color: #111827;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.98);
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
`;

const HeaderRow = styled.div`
  display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px;
`;

const Tabs = styled.div`
  display:flex; gap:8px; border-bottom:2px solid #e2e8f0; padding-bottom:2px; justify-content:flex-end;
`;

const TabButton = styled.button`
  padding:10px 16px; border:none; border-radius:8px 8px 0 0; cursor:pointer; font-size:14px; font-weight:500;
  transition: all 0.16s ease;
  background: ${({$active}) => $active ? 'linear-gradient(135deg,#258f3f,#269c4a)' : 'transparent'};
  color: ${({$active}) => $active ? '#fff' : '#64748b'};
  box-shadow: ${({$active}) => $active ? '0 2px 8px rgba(59,130,246,0.18)' : 'none'};
  &:hover { transform: translateY(-2px); color: #0f172a; background: ${({$active}) => $active ? 'linear-gradient(135deg,#1e7b36,#1f8b3f)' : '#f9fafb'} }
`;

const CardGrande = styled.div`
  background: rgba(255,255,255,0.96);
  border-radius: 16px;
  padding: 22px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(2,6,23,0.06);
  border: 1px solid #e6eef6;
`;

const Select = styled.select`
  padding: 10px; background: #f1f5f9; border-radius: 8px; border: 1px solid rgba(148,163,184,0.4); color: #111827;
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
