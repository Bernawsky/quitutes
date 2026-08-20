import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { Pedido } from "@/lib/pedidos"

// Fechamento diário automático de métricas — substitui o webhook do N8N.
// Protegido por CRON_SECRET (configurado no projeto Vercel + Vercel Cron).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const supabase = createAdminSupabaseClient()
  const hoje = new Date()
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()

  const { data, error } = await supabase
    .from("pedidos")
    .select("id, created_at, pousada, unidades, total_pessoas, status")
    .gte("created_at", inicioDoDia)
    .neq("status", "cancelado")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pedidos = (data ?? []) as unknown as Pedido[]
  const ranking = new Map<string, number>()
  for (const p of pedidos) {
    for (const u of p.unidades ?? []) {
      ranking.set(u.unidade, (ranking.get(u.unidade) ?? 0) + 1)
    }
  }
  const rankingArr = Array.from(ranking.entries())
    .map(([unidade, total]) => ({ unidade, total }))
    .sort((a, b) => b.total - a.total)

  const arquivo = `pedidos-dia-${hoje.toISOString().slice(0, 10)}`
  const { error: erroInsert } = await supabase.from("metricas_exportadas").insert({
    origem: "vercel-cron",
    gerado_em: new Date().toISOString(),
    arquivo,
    periodo: "dia",
    rotulo_periodo: "hoje",
    total_pedidos: pedidos.length,
    ranking: rankingArr as never,
  })

  if (erroInsert) return NextResponse.json({ error: erroInsert.message }, { status: 500 })

  return NextResponse.json({ ok: true, totalPedidos: pedidos.length, ranking: rankingArr })
}
