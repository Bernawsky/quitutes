# Serviço WhatsApp (open-wa)

Servidor HTTP independente que mantém uma sessão do WhatsApp Web autenticada e expõe um endpoint para enviar mensagens. Usa [`@open-wa/wa-automate`](https://github.com/open-wa/wa-automate-nodejs).

Isso **não é** parte do app Next.js — é um processo separado que precisa ficar sempre rodando (local, numa VM, num container, etc.), porque mantém uma sessão de navegador conectada ao WhatsApp Web.

## Por que um serviço separado?

O open-wa controla um Chromium headless conectado ao WhatsApp Web. Isso não roda dentro de funções serverless (Vercel/Next.js) nem dentro de uma sessão do Claude — precisa de um processo de longa duração com estado persistente.

## Como rodar

```bash
cd whatsapp-service
npm install
cp .env.example .env
# edite o .env e defina uma API_KEY forte
npm start
```

Na primeira execução, um **QR Code aparece no terminal**. Escaneie com o WhatsApp que vai enviar as mensagens (Configurações → Aparelhos conectados → Conectar um aparelho). A sessão fica salva localmente e não precisa escanear de novo nas próximas execuções.

## Uso

```bash
curl -X POST http://localhost:3333/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_API_KEY" \
  -d '{"to": "5562999999999", "message": "Olá! Relatório de métricas em anexo."}'
```

- `to`: apenas dígitos (DDI + DDD + número, ex: `5562999999999`)
- `message`: texto da mensagem

## Integrando com o n8n

No workflow "Quitutes", use um nó **HTTP Request** (POST) apontando para a URL pública desse serviço (`http://SEU_HOST:3333/send`), com o header `x-api-key` e o body `{ "to": "...", "message": "{{ $json.output.message }}" }`. Isso substitui o nó Twilio, sem precisar de conta paga.

## Aviso importante

Usar o WhatsApp dessa forma (não é a API oficial do WhatsApp Business) viola os Termos de Serviço do WhatsApp e pode levar ao banimento do número usado. Para uso em produção/negócio, prefira a API oficial (WhatsApp Cloud API da Meta) ou um provedor autorizado (Twilio, por exemplo). Use este serviço por sua conta e risco, idealmente com um número de teste.
