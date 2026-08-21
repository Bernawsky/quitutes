"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { emailsDosAdmins, enviarEmail } from "@/lib/email"
import { gerarAnaliseIA } from "@/lib/analise-ia"
import { montarEmailRelatorio } from "@/lib/relatorio-email"
import type { Ranking } from "@/lib/export-pedidos"
import type { Pedido } from "@/lib/pedidos"

/**
 * Fecha um período, grava o resumo em metricas_exportadas e dispara um
 * relatório por e-mail (analisado por IA) para os administradores.
 * Substitui o antigo envio ao webhook do N8N — roda inteiramente no Vercel/Supabase.
 */
export async function fecharPeriodo(input: {
  periodo: string
  rotuloPeriodo: string
  totalPedidos: number
  ranking: Ranking[]
  pedidos: Pedido[]
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

  const relatorio = await enviarRelatorioPorEmail(input).catch((e) => {
    console.error("Falha ao enviar relatório de fechamento de período:", e)
    return { enviado: false as const, motivo: e instanceof Error ? e.message : "Erro desconhecido ao gerar relatório" }
  })

  return { ok: true as const, arquivo, relatorio }
}

async function enviarRelatorioPorEmail(input: {
  rotuloPeriodo: string
  totalPedidos: number
  ranking: Ranking[]
  pedidos: Pedido[]
}) {
  const destinatarios = new Set(await emailsDosAdmins())
  for (const e of (process.env.RELATORIO_EMAILS_EXTRA ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    destinatarios.add(e)
  }
  if (destinatarios.size === 0) return { enviado: false as const, motivo: "Nenhum administrador com e-mail encontrado" }

  const ativos = input.pedidos.filter((p) => p.status !== "cancelado")
  const cancelados = input.pedidos.length - ativos.length
  const totalPessoas = ativos.reduce((acc, p) => acc + (p.total_pessoas ?? 0), 0)

  const porPousadaMapa = new Map<string, number>()
  for (const p of ativos) {
    const nome = p.pousada ?? "Vale do Sol"
    porPousadaMapa.set(nome, (porPousadaMapa.get(nome) ?? 0) + 1)
  }
  const porPousada = Array.from(porPousadaMapa.entries())
    .map(([pousada, total]) => ({ pousada, total }))
    .sort((a, b) => b.total - a.total)

  const dadosAnalise = {
    rotuloPeriodo: input.rotuloPeriodo,
    totalPedidos: input.totalPedidos,
    totalPessoas,
    cancelados,
    ranking: input.ranking,
    porPousada,
  }

  const analiseHtml = await gerarAnaliseIA(dadosAnalise)
  const html = montarEmailRelatorio({ ...dadosAnalise, analiseHtml })
  const subject = `Fechamento de período — ${input.rotuloPeriodo} — Quitutes`

  // Envia um a um: no modo sandbox do Resend (sem domínio verificado), só o e-mail
  // dono da conta recebe — enviar em lote faria um destinatário inválido derrubar todos.
  const resultados = await Promise.all(
    Array.from(destinatarios).map(async (to) => ({ to, ...(await enviarEmail({ to: [to], subject, html })) })),
  )

  const entregues = resultados.filter((r) => r.enviado)
  if (entregues.length === 0) {
    const motivos = resultados.map((r) => `${r.to}: ${r.motivo ?? "erro desconhecido"}`).join(" | ")
    return { enviado: false as const, motivo: motivos }
  }
  const falhas = resultados.filter((r) => !r.enviado)
  return {
    enviado: true as const,
    motivo:
      falhas.length > 0
        ? `Entregue para ${entregues.map((r) => r.to).join(", ")}. Falhou para ${falhas.map((r) => r.to).join(", ")}.`
        : undefined,
  }
}
