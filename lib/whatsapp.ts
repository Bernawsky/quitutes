type EnvioResultado = { enviado: boolean; motivo?: string }

/**
 * Envia mensagem de WhatsApp via o serviço open-wa (fora da Vercel, ver
 * whatsapp-service/). Requer WHATSAPP_SERVICE_URL e WHATSAPP_SERVICE_SECRET
 * configurados; sem eles, retorna enviado:false sem lançar erro.
 */
export async function enviarWhatsapp(input: { destinatarios: string[]; mensagem: string }): Promise<EnvioResultado> {
  const url = process.env.WHATSAPP_SERVICE_URL
  const segredo = process.env.WHATSAPP_SERVICE_SECRET
  if (!url || !segredo) {
    return { enviado: false, motivo: "WHATSAPP_SERVICE_URL ou WHATSAPP_SERVICE_SECRET não configurada" }
  }
  if (input.destinatarios.length === 0) {
    return { enviado: false, motivo: "Nenhum destinatário" }
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/enviar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${segredo}`, "Content-Type": "application/json" },
    body: JSON.stringify({ destinatarios: input.destinatarios, mensagem: input.mensagem }),
  })

  if (!res.ok) {
    const corpo = await res.text().catch(() => "")
    return { enviado: false, motivo: `Falha no envio (${res.status}): ${corpo}` }
  }

  const data = (await res.json().catch(() => null)) as { resultados?: { destino: string; enviado: boolean; motivo?: string }[] } | null
  const falhas = data?.resultados?.filter((r) => !r.enviado) ?? []
  if (falhas.length > 0 && falhas.length === data?.resultados?.length) {
    return { enviado: false, motivo: falhas.map((f) => `${f.destino}: ${f.motivo}`).join(" | ") }
  }
  return { enviado: true, motivo: falhas.length > 0 ? `Falhou para: ${falhas.map((f) => f.destino).join(", ")}` : undefined }
}

/** Números de WhatsApp que devem receber os relatórios/alertas administrativos. */
export function numerosDosAdmins(): string[] {
  return (process.env.WHATSAPP_DESTINATARIOS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
