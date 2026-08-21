"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { enviarWhatsapp, numerosDosAdmins } from "@/lib/whatsapp"
import { gerarAnaliseIA } from "@/lib/analise-ia"
import { montarMensagemRelatorio } from "@/lib/relatorio-whatsapp"
import type { Ranking } from "@/lib/export-pedidos"
import type { Pedido } from "@/lib/pedidos"

/**
 * Fecha um período, grava o resumo em metricas_exportadas e dispara um
 * relatório por WhatsApp (analisado por IA) para os administradores.
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

  const relatorio = await enviarRelatorioPorWhatsapp(input).catch((e) => {
    console.error("Falha ao enviar relatório de fechamento de período:", e)
    return { enviado: false as const, motivo: e instanceof Error ? e.message : "Erro desconhecido ao gerar relatório" }
  })

  return { ok: true as const, arquivo, relatorio }
}

async function enviarRelatorioPorWhatsapp(input: {
  rotuloPeriodo: string
  totalPedidos: number
  ranking: Ranking[]
  pedidos: Pedido[]
}) {
  const destinatarios = numerosDosAdmins()
  if (destinatarios.length === 0) return { enviado: false as const, motivo: "Nenhum número em WHATSAPP_DESTINATARIOS" }

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

  const analiseTexto = await gerarAnaliseIA(dadosAnalise)
  const mensagem = montarMensagemRelatorio({ ...dadosAnalise, analiseTexto })

  return enviarWhatsapp({ destinatarios, mensagem })
}
