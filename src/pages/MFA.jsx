import React, { useEffect, useState } from "react";
import styled from "styled-components";

const API_URL = "https://dashboard-iot-silos-backend-1.onrender.com/api";

export default function MFA() {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/mfa/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha no setup");

      const data = await res.json();
      setSetupData(data);
    } catch (e) {
      console.error(e);
      alert("Erro ao iniciar setup MFA");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/mfa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: code }),
      });

      if (!res.ok) throw new Error(await res.text());

      alert("MFA habilitado com sucesso");

      // Atualiza current_user
      try {
        const meResp = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });
        if (meResp.ok) {
          const me = await meResp.json();
          localStorage.setItem("current_user", JSON.stringify(me));
        }
      } catch (e) {
        console.warn("Erro ao atualizar current_user:", e);
      }
    } catch (e) {
      console.error(e);
      alert("Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Autenticação Multifator (MFA)</Title>
        <Description>
          Ative a autenticação multifator usando um aplicativo como{" "}
          <strong>Microsoft Authenticator</strong> ou Google Authenticator.
        </Description>

        <Button onClick={startSetup} disabled={loading}>
          {loading ? "Gerando..." : "Gerar Chave Secreta"}
        </Button>

        {setupData && (
          <SetupBox>
            <p>
              <strong>Secret:</strong> <Code>{setupData.secret}</Code>
            </p>

            <QRCode
              alt="QR code"
              src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(
                setupData.otpauth_url
              )}`}
            />
          </SetupBox>
        )}

        <Label>Código do app:</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código de 6 dígitos"
        />

        <Button onClick={verify} disabled={loading}>
          {loading ? "Validando..." : "Verificar Código"}
        </Button>
      </Card>
    </Container>
  );
}

/* ------------------------------------------ */
/*       🟣 Styled Components (tema lilás)    */
/* ------------------------------------------ */

const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 20px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  color: #111; /* <-- tudo escuro */

  box-shadow: 0 4px 20px rgba(0,0,0,0.12);

  strong {
    color: #111;
  }
`;


const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
`;

const Description = styled.p`
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 20px;
  text-align: center;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: #479447;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    background: #9f67ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SetupBox = styled.div`
  text-align: center;
  margin: 16px 0;
`;

const Code = styled.code`
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 14px;
`;

const QRCode = styled.img`
  margin-top: 12px;
  border-radius: 8px;
`;

const Label = styled.label`
  margin-top: 12px;
  display: block;
  font-size: 14px;
  opacity: 0.85;
`;

const Input = styled.input`
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
  color: #111;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

