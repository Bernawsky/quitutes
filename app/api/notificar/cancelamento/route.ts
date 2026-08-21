import { NextResponse } from "next/server"
import { enviarEmail, emailsDosAdmins } from "@/lib/email"

/** Chamado pelo app logo após um cancelamento bem-sucedido, para avisar os admins. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const pedidoId = Number(body?.pedidoId)
  const pousada = String(body?.pousada ?? "").slice(0, 120)
  const motivo = String(body?.motivo ?? "").slice(0, 280)

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "pedidoId inválido" }, { status: 400 })
  }

  const admins = await emailsDosAdmins()
  const resultado = await enviarEmail({
    to: admins,
    subject: `Pedido #${pedidoId} cancelado — ${pousada}`,
    html: `<p><strong>${pousada}</strong> cancelou o pedido #${pedidoId}.</p>${motivo ? `<p>Motivo: ${motivo}</p>` : ""}`,
  })

  return NextResponse.json(resultado)
}
