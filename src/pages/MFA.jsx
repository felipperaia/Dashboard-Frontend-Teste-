import React, { useState, useRef } from "react";
import styled from "styled-components";
import qrcodeLib from "qrcode";

const API_URL = "https://dashboard-backend-teste.onrender.com/api";

export default function MFA() {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const canvasRef = useRef(null);

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
      setQrError(false);
      // try to render QR into canvas for more reliable display
      try {
        if (canvasRef.current && (data.otpauth_url || data.uri || data.qr)) {
          const uri = data.otpauth_url || data.uri || data.qr;
          await qrcodeLib.toCanvas(canvasRef.current, uri, { errorCorrectionLevel: "H", scale: 6 });
          setQrError(false);
        }
      } catch (qrErr) {
        console.warn("QR render failed", qrErr);
        setQrError(true);
      }
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

            <div style={{display: 'flex', justifyContent: 'center'}}>
              <canvas ref={canvasRef} style={{ display: qrError ? 'none' : 'block', maxWidth: 220, borderRadius: 8 }} />
            </div>
            {qrError && (
              <div style={{padding:12, background:'#fff', borderRadius:8, textAlign:'center'}}>
                <p style={{margin:0}}>Não foi possível gerar o QR. Copie a chave abaixo e adicione manualmente no app autenticador.</p>
                <pre style={{background:'#f3f4f6', padding:8, borderRadius:6, marginTop:8}}>{setupData.otpauth_url || setupData.uri || setupData.qr}</pre>
                <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(setupData.otpauth_url || setupData.uri || setupData.qr); alert('URL copiada para área de transferência'); }} style={{marginTop:8, padding:'8px 12px', borderRadius:6, border:'none', background:'#4f46e5', color:'#fff'}}>Copiar otpauth_url</button>
              </div>
            )}
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

