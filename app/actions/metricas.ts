"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Ranking } from "@/lib/export-pedidos"

/**
 * Fecha um período e grava o resumo em metricas_exportadas.
 * Substitui o antigo envio ao webhook do N8N — roda inteiramente no Vercel/Supabase.
 */
export async function fecharPeriodo(input: {
  periodo: string
  rotuloPeriodo: string
  totalPedidos: number
  ranking: Ranking[]
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const arquivo = `pedidos-${input.periodo}-${new Date().toISOString().slice(0, 10)}`

  const { error } = await supabase.from("metricas_exportadas").insert({
    origem: "vercel-quitutes",
    gerado_em: new Date().toISOString(),
    arquivo,
    periodo: input.periodo,
    rotulo_periodo: input.rotuloPeriodo,
    total_pedidos: input.totalPedidos,
    ranking: input.ranking as never,
  })

  if (error) throw new Error(error.message)
  return { ok: true as const, arquivo }
}
