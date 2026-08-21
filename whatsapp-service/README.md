# Quitutes — serviço de WhatsApp (open-wa)

Serviço standalone que mantém uma sessão do WhatsApp Web autenticada e expõe
uma API HTTP simples para o app Next.js (na Vercel) disparar mensagens. Não
roda na Vercel — precisa de um host com processo persistente (Railway, Fly.io,
uma VPS, etc), porque o open-wa mantém um navegador headless logado o tempo
todo, não é uma função serverless.

> **Aviso:** o open-wa automatiza o WhatsApp Web de um número real — não é a
> API oficial do WhatsApp Business. Use um número dedicado para isso (não o
> seu pessoal) e evite alto volume de mensagens, para reduzir o risco de o
> número ser suspenso pelo WhatsApp.

## Deploy no Railway

1. Crie um projeto novo no [railway.app](https://railway.app), "Deploy from GitHub repo", apontando para este repositório com **root directory** `whatsapp-service`.
2. Railway detecta o `Dockerfile` automaticamente.
3. Em **Variables**, defina:
   - `WHATSAPP_SERVICE_SECRET` — uma string aleatória forte (ex: gere com `openssl rand -hex 32`). O app Next.js vai usar o mesmo valor para autenticar as chamadas.
4. Adicione um **Volume** persistente montado em `/app/_IGNORE_sessions` (ou o diretório de sessão do open-wa) — sem isso, a sessão do WhatsApp se perde a cada deploy e você precisa escanear o QR de novo toda vez.
5. Deploy. Nos **logs** do primeiro deploy vai aparecer um QR code em ASCII (ou um link) — escaneie com o WhatsApp do número **+55 32 984275356** (Configurações → Aparelhos conectados → Conectar um aparelho).
6. Depois de conectado, os logs mostram "open-wa conectado — serviço pronto para enviar mensagens." A sessão fica salva no volume, sobrevive a redeploys.
7. Copie a **URL pública** que o Railway gera pro serviço (ex: `https://quitutes-whatsapp.up.railway.app`).

## Configurar no app Next.js (Vercel)

Nas Environment Variables do projeto `quites`:

```
WHATSAPP_SERVICE_URL=https://<sua-url-do-railway>
WHATSAPP_SERVICE_SECRET=<o mesmo valor do passo 3 acima>
WHATSAPP_DESTINATARIOS=5532988887777,5532999998888
```

## Testando

```
curl -X POST https://<sua-url>/enviar \
  -H "Authorization: Bearer <WHATSAPP_SERVICE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"destinatarios": ["5532988887777"], "mensagem": "Teste Quitutes"}'
```
