const express = require("express")
const { create } = require("@open-wa/wa-automate")

const PORTA = process.env.PORT || 8080
const SEGREDO = process.env.WHATSAPP_SERVICE_SECRET

if (!SEGREDO) {
  console.error("WHATSAPP_SERVICE_SECRET não configurado — defina antes de subir o serviço.")
  process.exit(1)
}

let clienteWhatsapp = null

function normalizarNumero(numero) {
  const digitos = String(numero).replace(/\D/g, "")
  return digitos.includes("@") ? numero : `${digitos}@c.us`
}

create({
  sessionId: "quitutes",
  multiDevice: true,
  authTimeout: 60,
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  qrTimeout: 0,
  logConsole: false,
  popup: false,
  useChrome: true,
}).then((cliente) => {
  clienteWhatsapp = cliente
  console.log("open-wa conectado — serviço pronto para enviar mensagens.")
})

const app = express()
app.use(express.json())

app.get("/status", (_req, res) => {
  res.json({ conectado: clienteWhatsapp !== null })
})

app.post("/enviar", async (req, res) => {
  if (req.headers.authorization !== `Bearer ${SEGREDO}`) {
    return res.status(401).json({ erro: "Não autorizado" })
  }
  if (!clienteWhatsapp) {
    return res.status(503).json({ erro: "WhatsApp ainda não conectado (sessão não autenticada ou reiniciando)" })
  }

  const { destinatarios, mensagem } = req.body ?? {}
  if (!Array.isArray(destinatarios) || destinatarios.length === 0 || typeof mensagem !== "string" || !mensagem.trim()) {
    return res.status(400).json({ erro: "Envie { destinatarios: string[], mensagem: string }" })
  }

  const resultados = []
  for (const destino of destinatarios) {
    try {
      await clienteWhatsapp.sendText(normalizarNumero(destino), mensagem)
      resultados.push({ destino, enviado: true })
    } catch (e) {
      resultados.push({ destino, enviado: false, motivo: e instanceof Error ? e.message : "erro desconhecido" })
    }
  }

  res.json({ resultados })
})

app.listen(PORTA, () => console.log(`Serviço WhatsApp escutando na porta ${PORTA}`))
