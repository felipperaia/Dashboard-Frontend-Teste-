# Frontend — Deméter - Monitoring Dashboard (Vite + React PWA)

Este diretório deve se tornar o repositório `silo-monitor-frontend`.

Arquivos/dirs que pertencem ao repositório frontend
- vite-react/
  - src/
  - public/ (sw.js, manifest.json, icons)
  - package.json
  - vite.config.js
  - netlify.toml
  - README.md (este arquivo)
- static assets (icons, logos)

Quickstart local
1. Clone o repo frontend:
   git clone <url-do-repo-frontend>
   cd silo-monitor-frontend

2. Instale dependências:
   npm install

3. Rodar em dev:
   npm run dev
   Abra http://localhost:5173 (ou a porta exibida pelo Vite)

Gerar VAPID keys (para Web Push)
- Recomendado executar em frontend (ou raiz) via npx:
  npx web-push generate-vapid-keys --json
  copie publicKey para backend (VAPID_PUBLIC_KEY)
- O frontend obtém a chave pública do backend via /api/notifications/vapid_public por padrão,
  então não é obrigatório colocar VAPID_PUBLIC_KEY no frontend.

Configurar deploy (Netlify)
- Build: npm run build
- Publish directory: dist
- Defina VITE_API_URL com a URL do backend (ex: https://api.seu-dominio.com/api)

---

Resumo da refatoração aplicada (front-end)

- Adicionados ícones SVG e `logo.svg` em `src/assets/`.
- Header: exibe nome do usuário (puxado de `localStorage.current_user`), role e traço visual branco abaixo do bloco de usuário; responsivo (mobile hamburger menu).
- `Dashboard`:
   - Nova aba `Dashboard Simplificado` com cards por métrica (Temperatura, Umidade, CO₂, Gases, Luminosidade).
   - Forms: criação de silo agora pede `device_id`, `latitude` e `longitude` opcionais e botão para preencher via geolocalização do navegador.
   - Leituras manuais: formulário expandido (CO₂, MQ2, lux, luminosity flag) e restrito a usuários com role `admin` (front-end verifica `localStorage.current_user.role`).
- `Chat` (Assistente Deméter): persistência do histórico em `localStorage` e renderização segura de Markdown simples (escape HTML + negrito/listas básicas).
- `src/services/api.js` agora usa `VITE_API_URL` (se definido) como `API_URL`; caso contrário há fallback para o URL atualmente embutido.
- `netlify.toml` atualizado com redirect `/* -> /index.html` para suportar SPA routing em produção.

Mapeamento ThingSpeak (padrão usado pelo backend)
- `field1` -> `temp_C`
- `field2` -> `rh_pct`
- `field3` -> `co2_ppm_est`
- `field4` -> `mq2_raw`
- `field5` -> `luminosity_alert` (flag 0/1)
- `field6` -> `lux` (iluminância em lux)

Notas de deploy e variáveis de ambiente (front-end)
- Defina `VITE_API_URL` no ambiente de build (Netlify / Vercel) apontando para a API do backend (inclua `/api` no final se seu backend expõe a API sob `/api`).
- Netlify: Build command `npm run build`; Publish `dist`; adicione `VITE_API_URL` nas Environment variables do site.

Pendências / recomendações (front-end)
- Melhorar renderização de Markdown com `react-markdown` + `rehype-sanitize` para cobertura completa e segurança.
- Criar tela de Relatório com botão "Gerar PDF" que chama endpoint back-end (pendente no back-end).

Como testar localmente as mudanças front-end
1. Instale dependências: `npm install`
2. Defina `VITE_API_URL` (opcional para testes locais) ou use `localStorage.setItem('access_token', '<token>')` e `localStorage.setItem('current_user', JSON.stringify({role:'admin', username:'dev'}))` para testar formulários de admin.
3. Rode: `npm run dev`
4. Verifique: aba `Dashboard Simplificado`, página `Chat` (envie/atualize mensagens e recarregue para ver persistência), criação de silo (use "Preencher com localização atual"), leitura manual (visível apenas para admin).

Se desejar que eu implemente a tela de Relatório e PDF ou a integração RAG (endpoints + orchestration para a Assistente Deméter), indique qual priorizo e eu continuo implementando.


MFA / TOTP
- A aplicação frontend tem suporte para configurar MFA (TOTP) usando o endpoint `/api/mfa/setup` e `/api/mfa/verify`.
- Para testar localmente, habilite a rota `/api/mfa` no backend e use um app autenticador (Microsoft Authenticator ou Google Authenticator).

Web Push (VAPID)
- Gere chaves VAPID e configure no backend (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY). O frontend consulta `/api/notifications/vapid_public` para registrar o service worker.

.gitignore sugerido (crie no repo)
# Node
node_modules/
dist/
.env
.vscode/
