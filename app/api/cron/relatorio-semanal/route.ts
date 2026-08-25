import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { enviarWhatsapp, numerosDosAdmins } from "@/lib/whatsapp"

/** Resumo semanal por WhatsApp (roda toda segunda-feira). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
  const seteDiasAtrasISO = seteDiasAtras.toISOString().slice(0, 10)

  const { data: pedidos, error } = await admin
    .from("pedidos")
    .select("pousada, total_pessoas, status, data_pedido")
    .gte("data_pedido", seteDiasAtrasISO)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ativos = (pedidos ?? []).filter((p) => p.status !== "cancelado")
  const totalPedidos = ativos.length
  const totalPessoas = ativos.reduce((acc, p) => acc + (p.total_pessoas ?? 0), 0)

  const porPousada = new Map<string, number>()
  for (const p of ativos) porPousada.set(p.pousada, (porPousada.get(p.pousada) ?? 0) + 1)
  const ranking = Array.from(porPousada.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nome, total]) => `- ${nome}: ${total} pedido(s)`)
    .join("\n")

  const resultado = await enviarWhatsapp({
    destinatarios: numerosDosAdmins(),
    mensagem: `*Relatório semanal Quitutes — ${totalPedidos} pedidos*\n\nÚltimos 7 dias: *${totalPedidos}* pedidos ativos, *${totalPessoas}* pessoas atendidas.\n\n*Por pousada*\n${ranking}`,
  })

  return NextResponse.json({ ok: true, totalPedidos, totalPessoas, whatsapp: resultado })
}
