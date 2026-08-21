import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { enviarEmail, emailsDosAdmins } from "@/lib/email"

/** Resumo semanal por e-mail (roda toda segunda-feira). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  const { data: pedidos, error } = await admin
    .from("pedidos")
    .select("pousada, total_pessoas, status, created_at")
    .gte("created_at", seteDiasAtras.toISOString())
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ativos = (pedidos ?? []).filter((p) => p.status !== "cancelado")
  const totalPedidos = ativos.length
  const totalPessoas = ativos.reduce((acc, p) => acc + (p.total_pessoas ?? 0), 0)

  const porPousada = new Map<string, number>()
  for (const p of ativos) porPousada.set(p.pousada, (porPousada.get(p.pousada) ?? 0) + 1)
  const ranking = Array.from(porPousada.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nome, total]) => `<li>${nome}: ${total} pedido(s)</li>`)
    .join("")

  const admins = await emailsDosAdmins()
  const resultado = await enviarEmail({
    to: admins,
    subject: `Relatório semanal Quitutes — ${totalPedidos} pedidos`,
    html: `
      <p><strong>Últimos 7 dias:</strong> ${totalPedidos} pedidos ativos, ${totalPessoas} pessoas atendidas.</p>
      <p><strong>Por pousada:</strong></p>
      <ul>${ranking}</ul>
    `,
  })

  return NextResponse.json({ ok: true, totalPedidos, totalPessoas, email: resultado })
}
