import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { enviarWhatsapp, numerosDosAdmins } from "@/lib/whatsapp"

/** Lembrete perto do prazo (16h): quais pousadas ainda não enviaram pedido hoje. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: pousadas, error: erroPousadas } = await admin.from("pousadas").select("id, nome").eq("ativa", true)
  if (erroPousadas) return NextResponse.json({ error: erroPousadas.message }, { status: 500 })

  const { data: pedidosHoje, error: erroPedidos } = await admin
    .from("pedidos")
    .select("pousada_id")
    .neq("status", "cancelado")
    .eq("data_pedido", hoje)
  if (erroPedidos) return NextResponse.json({ error: erroPedidos.message }, { status: 500 })

  const comPedido = new Set((pedidosHoje ?? []).map((p) => p.pousada_id))
  const pendentes = (pousadas ?? []).filter((p) => !comPedido.has(p.id))

  if (pendentes.length === 0) {
    return NextResponse.json({ ok: true, pendentes: 0 })
  }

  const resultado = await enviarWhatsapp({
    destinatarios: numerosDosAdmins(),
    mensagem: `*${pendentes.length} pousada(s) sem pedido hoje*\n\n${pendentes.map((p) => `- ${p.nome}`).join("\n")}`,
  })

  return NextResponse.json({ ok: true, pendentes: pendentes.map((p) => p.nome), whatsapp: resultado })
}
