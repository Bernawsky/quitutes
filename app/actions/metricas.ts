"use server"

import { sql } from "@/lib/db"
import { getPedidos } from "@/app/actions/pedidos"
import { dentroDoPeriodo, LABEL_PERIODO, type Periodo } from "@/lib/periodo"
import { revalidatePath } from "next/cache"

type MetricaExportada = {
  id: number
  origem: string | null
  gerado_em: string | null
  arquivo: string | null
  periodo: string | null
  rotulo_periodo: string | null
  total_pedidos: number | null
  ranking: { pousada: string; total: number }[] | null
  created_at: string
}

async function ensureMetricasTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS metricas_exportadas (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      origem TEXT,
      gerado_em TIMESTAMPTZ,
      arquivo TEXT,
      periodo TEXT,
      rotulo_periodo TEXT,
      total_pedidos INTEGER,
      ranking JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `
}

// Substitui o antigo webhook do N8N ("Receber PDF" -> "Salvar Métricas no Supabase"):
// fecha o período direto a partir dos pedidos salvos, sem depender de automação externa.
export async function exportarMetricas(periodo: Periodo) {
  await ensureMetricasTable()

  const pedidos = await getPedidos()
  const filtrados = pedidos.filter((p) => dentroDoPeriodo(p.created_at, periodo))

  const ranking = new Map<string, number>()
  for (const p of filtrados) {
    for (const u of p.unidades) {
      const chave = u.pousada || u.pousadaId
      ranking.set(chave, (ranking.get(chave) ?? 0) + 1)
    }
  }
  const rankingArr = Array.from(ranking.entries())
    .map(([pousada, total]) => ({ pousada, total }))
    .sort((a, b) => b.total - a.total)

  const arquivo = `metricas-${periodo}-${new Date().toISOString().slice(0, 10)}.json`

  await sql`
    INSERT INTO metricas_exportadas (origem, gerado_em, arquivo, periodo, rotulo_periodo, total_pedidos, ranking)
    VALUES (
      'Claude Code',
      now(),
      ${arquivo},
      ${periodo},
      ${LABEL_PERIODO[periodo]},
      ${filtrados.length},
      ${JSON.stringify(rankingArr)}::jsonb
    )
  `

  revalidatePath("/metricas")
  return { totalPedidos: filtrados.length, ranking: rankingArr, arquivo }
}

export async function getMetricasExportadas(): Promise<MetricaExportada[]> {
  await ensureMetricasTable()
  const rows = await sql`
    SELECT id, origem, gerado_em, arquivo, periodo, rotulo_periodo, total_pedidos, ranking, created_at
    FROM metricas_exportadas
    ORDER BY created_at DESC
    LIMIT 20
  `
  return rows as MetricaExportada[]
}
