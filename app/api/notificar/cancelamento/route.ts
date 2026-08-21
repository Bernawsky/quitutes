import { NextResponse } from "next/server"
import { enviarWhatsapp, numerosDosAdmins } from "@/lib/whatsapp"

/** Chamado pelo app logo após um cancelamento bem-sucedido, para avisar os admins. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const pedidoId = Number(body?.pedidoId)
  const pousada = String(body?.pousada ?? "").slice(0, 120)
  const motivo = String(body?.motivo ?? "").slice(0, 280)

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "pedidoId inválido" }, { status: 400 })
  }

  const resultado = await enviarWhatsapp({
    destinatarios: numerosDosAdmins(),
    mensagem: `*${pousada}* cancelou o pedido #${pedidoId}.${motivo ? `\nMotivo: ${motivo}` : ""}`,
  })

  return NextResponse.json(resultado)
}
