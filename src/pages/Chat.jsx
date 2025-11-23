import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import api from "../services/api";

// ==========================
// Styled Components
// ==========================

const ChatWrapper = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 80vh;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 15px;
  text-align: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
`;

const Message = styled.div`
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;

  ${(props) =>
    props.role === "assistant"
      ? `
      align-self: flex-start;
      background: #e2e8f0;
      color: #1e293b;
    `
      : `
      align-self: flex-end;
      background: #4f46e5;
      color: white;
    `}
`;

const ChatForm = styled.form`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  outline: none;

  &:focus {
    border-color: #4f46e5;
  }
`;

const Button = styled.button`
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    background: #a5b4fc;
    cursor: not-allowed;
  }
`;

// ==========================
// COMPONENTE PRINCIPAL
// ==========================
export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Olá! Sou a Deméter, sua assistente virtual. Como posso ajudar você hoje?",
    },
  ]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Persistência da conversa enquanto o usuário estiver logado
  useEffect(()=>{
    try {
      // Only restore chat if user is logged in
      const token = localStorage.getItem('access_token');
      if (!token) { localStorage.removeItem('demeter_chat_history'); return; }
      const raw = localStorage.getItem('demeter_chat_history');
      if (raw) setMessages(JSON.parse(raw));
    } catch(e){}
  }, []);

  useEffect(()=>{
    try { 
      // Persist only while user is logged in
      const token = localStorage.getItem('access_token');
      if (token) localStorage.setItem('demeter_chat_history', JSON.stringify(messages)); 
    } catch(e){}
  }, [messages]);

  // listen for logout in other tabs and clear chat
  useEffect(()=>{
    const onStorage = (ev) => {
      if (ev.key === 'access_token' && !ev.newValue) {
        setMessages([{
          role: 'assistant',
          content: 'Olá! Sou a Deméter, sua assistente virtual. Como posso ajudar você hoje?'
        }]);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat", [
        { role: "user", content: userMessage.content },
      ]);

      const botMessage = {
        role: "assistant",
        content: response.reply || "(sem resposta)",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
        },
      ]);
      try { localStorage.setItem('demeter_chat_history', JSON.stringify([...messages, {role:'assistant', content:'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?'}])); } catch(e){}
    } finally {
      setLoading(false);
    }
  };

  // renderizador simples e seguro de Markdown (apenas **bold**, listas e quebras de linha)
  const renderMarkdownSafe = (text) => {
    if (!text) return '';
    const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let out = escapeHtml(text);
    // bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // italic with single * or _
    out = out.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
    // code block ```
    out = out.replace(/```([\s\S]*?)```/g, function(_, code) {
      return '<pre><code>' + code.replace(/&lt;br\/>/g, '\n') + '</code></pre>'
    });
    // inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    // lists
    out = out.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>');
    if (out.includes('<li>')) out = '<ul>' + out.replace(/(<li>.*?<\/li>)/gs,'$1') + '</ul>';
    // line breaks
    out = out.replace(/\n/g, '<br/>');
    return out;
  };

  const emojis = ['😀','😃','😄','😁','😆','😊','😉','😍','🤖','🔥','🌡️','💧','🌦️','⚠️'];

  const insertEmoji = (em) => {
    setInput((prev) => prev + em);
    setShowEmojiPicker(false);
  };

  return (
    <ChatWrapper>
      <Title>Assistente Deméter</Title>

      <MessagesContainer>
        {messages.map((msg, idx) => (
          <Message key={idx} role={msg.role}>
            <div dangerouslySetInnerHTML={{__html: renderMarkdownSafe(msg.content)}} />
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <ChatForm onSubmit={handleSubmit}>
        <div style={{display:'flex', flexDirection:'column', gap:8, flex:1}}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{background:'transparent', border:'none', cursor:'pointer'}}>😊</button>
            {showEmojiPicker && (
              <div style={{display:'flex', gap:6, background:'#fff', padding:8, borderRadius:8}}>
                {emojis.map(e => <button key={e} onClick={()=>insertEmoji(e)} style={{background:'transparent', border:'none', fontSize:18, cursor:'pointer'}}>{e}</button>)}
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </ChatForm>
    </ChatWrapper>
  );
}
