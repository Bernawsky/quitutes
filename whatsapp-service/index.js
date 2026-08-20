require("dotenv").config()
const express = require("express")
const { create } = require("@open-wa/wa-automate")

const PORT = process.env.PORT || 3333
const API_KEY = process.env.API_KEY

if (!API_KEY) {
  console.error("Defina API_KEY no .env antes de iniciar o servidor.")
  process.exit(1)
}

function requireApiKey(req, res, next) {
  if (req.header("x-api-key") !== API_KEY) {
    return res.status(401).json({ error: "unauthorized" })
  }
  next()
}

async function start() {
  // Na primeira execução, um QR Code aparece no terminal — escaneie com o
  // WhatsApp do número que vai enviar as mensagens (Configurações > Aparelhos conectados).
  const client = await create({
    sessionId: "quitutes",
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    qrTimeout: 0,
  })

  const app = express()
  app.use(express.json())

  app.get("/health", (req, res) => res.json({ status: "ok" }))

  // Body: { "to": "5562999999999", "message": "texto" }
  // "to" aceita apenas dígitos (DDI+DDD+número); o sufixo @c.us é adicionado aqui.
  app.post("/send", requireApiKey, async (req, res) => {
    const { to, message } = req.body || {}
    if (!to || !message) {
      return res.status(400).json({ error: "campos obrigatórios: to, message" })
    }
    try {
      const chatId = `${String(to).replace(/\D/g, "")}@c.us`
      const result = await client.sendText(chatId, message)
      res.json({ success: true, result })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.listen(PORT, () => {
    console.log(`Serviço WhatsApp (open-wa) rodando em http://localhost:${PORT}`)
  })
}

start()
