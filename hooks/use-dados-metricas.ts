"use client"

import { useEffect, useMemo } from "react"
import useSWR, { mutate as mutateGlobal } from "swr"
import { getPedidos } from "@/lib/pedidos-api"
import { getPousadas } from "@/lib/pousadas-api"
import { dataLocal, hojeISO, type Pedido } from "@/lib/pedidos"
import { supabase } from "@/lib/supabase/client"
import { useFiltrosMetricas, type Periodo } from "@/hooks/use-filtros-metricas"

export const LABEL_PERIODO: Record<Periodo, string> = {
  dia: "hoje",
  semana: "nos últimos 7 dias",
  mes: "neste mês",
  ano: "neste ano",
}

function dentroDoPeriodo(data: Date, periodo: Periodo): boolean {
  const agora = new Date()
  switch (periodo) {
    case "dia":
      return data.toDateString() === agora.toDateString()
    case "semana": {
      const limite = new Date(agora)
      limite.setDate(agora.getDate() - 6)
      limite.setHours(0, 0, 0, 0)
      return data >= limite
    }
    case "mes":
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear()
    case "ano":
      return data.getFullYear() === agora.getFullYear()
  }
}

/** Mesmo tamanho de janela do período selecionado, mas imediatamente anterior — para o comparativo. */
function dentroDoPeriodoAnterior(data: Date, periodo: Periodo): boolean {
  const agora = new Date()
  switch (periodo) {
    case "dia": {
      const ontem = new Date(agora)
      ontem.setDate(agora.getDate() - 1)
      return data.toDateString() === ontem.toDateString()
    }
    case "semana": {
      const fim = new Date(agora)
      fim.setDate(agora.getDate() - 7)
      fim.setHours(0, 0, 0, 0)
      const inicio = new Date(agora)
      inicio.setDate(agora.getDate() - 13)
      inicio.setHours(0, 0, 0, 0)
      return data >= inicio && data < fim
    }
    case "mes": {
      const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
      return data.getMonth() === mesAnterior.getMonth() && data.getFullYear() === mesAnterior.getFullYear()
    }
    case "ano":
      return data.getFullYear() === agora.getFullYear() - 1
  }
}

export function chaveGrafico(data: Date, periodo: Periodo): string {
  if (periodo === "dia") return `${String(data.getHours()).padStart(2, "0")}h`
  if (periodo === "semana") return data.toLocaleDateString("pt-BR", { weekday: "short" })
  if (periodo === "mes") return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`
  return data.toLocaleDateString("pt-BR", { month: "short" })
}

export function delta(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null
  return Math.round(((atual - anterior) / anterior) * 100)
}

/** Assina mudanças em tempo real na tabela pedidos e revalida o cache do SWR. Chame uma vez (no shell). */
export function useRealtimePedidos() {
  useEffect(() => {
    const canal = supabase
      .channel("pedidos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => void mutateGlobal("pedidos"))
      .subscribe()
    return () => {
      void supabase.removeChannel(canal)
    }
  }, [])
}

/**
 * Dados e agregações compartilhados entre as páginas de métricas, filtrados
 * pelo período e pousadas selecionados (guardados na URL, ver use-filtros-metricas).
 */
export function useDadosMetricas(extra?: { busca?: string; dataExata?: string }) {
  const { periodo, pousadasSelecionadas } = useFiltrosMetricas()
  const { data: pedidos = [], isLoading, mutate } = useSWR<Pedido[]>("pedidos", getPedidos)
  const { data: pousadas = [] } = useSWR("pousadas", getPousadas)

  const busca = extra?.busca ?? ""
  const dataExata = extra?.dataExata ?? ""

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (!dentroDoPeriodo(dataLocal(p.data_pedido), periodo)) return false
      if (pousadasSelecionadas.length > 0 && !pousadasSelecionadas.includes(p.pousada ?? "")) return false
      if (dataExata && p.data_pedido !== dataExata) return false
      if (termo) {
        const alvo = [p.pousada, p.saudacao, p.titulo, ...(p.unidades ?? []).map((u) => u.unidade)].join(" ").toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      return true
    })
  }, [pedidos, periodo, pousadasSelecionadas, busca, dataExata])

  const ativos = useMemo(() => filtrados.filter((p) => p.status !== "cancelado"), [filtrados])

  const ativosAnteriores = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          p.status !== "cancelado" &&
          dentroDoPeriodoAnterior(dataLocal(p.data_pedido), periodo) &&
          (pousadasSelecionadas.length === 0 || pousadasSelecionadas.includes(p.pousada ?? "")),
      ),
    [pedidos, periodo, pousadasSelecionadas],
  )

  const totais = useMemo(() => {
    return ativos.reduce(
      (acc, p) => {
        acc.pedidos += 1
        acc.unidades += p.total_unidades
        acc.itens += p.total_itens
        acc.pessoas += p.total_pessoas ?? 0
        return acc
      },
      { pedidos: 0, unidades: 0, itens: 0, pessoas: 0 },
    )
  }, [ativos])

  const totaisAnteriores = useMemo(() => {
    return ativosAnteriores.reduce(
      (acc, p) => {
        acc.pedidos += 1
        acc.pessoas += p.total_pessoas ?? 0
        return acc
      },
      { pedidos: 0, pessoas: 0 },
    )
  }, [ativosAnteriores])

  const serie = useMemo(() => {
    const mapa = new Map<string, { periodo: string; pedidos: number; pessoas: number }>()
    for (const p of ativos) {
      const chave = chaveGrafico(dataLocal(p.data_pedido), periodo)
      const atual = mapa.get(chave) ?? { periodo: chave, pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(chave, atual)
    }
    return Array.from(mapa.values())
  }, [ativos, periodo])

  const porUnidade = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of ativos) {
      for (const u of p.unidades ?? []) {
        mapa.set(u.unidade, (mapa.get(u.unidade) ?? 0) + 1)
      }
    }
    return Array.from(mapa.entries())
      .map(([unidade, total]) => ({ unidade, total }))
      .sort((a, b) => b.total - a.total)
  }, [ativos])

  const porPousada = useMemo(() => {
    const mapa = new Map<string, { pedidos: number; pessoas: number }>()
    for (const p of ativos) {
      const nome = p.pousada ?? "—"
      const atual = mapa.get(nome) ?? { pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(nome, atual)
    }
    return Array.from(mapa.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.pedidos - a.pedidos)
  }, [ativos])

  const pendencias = useMemo(() => {
    const hoje = hojeISO()
    const pousadasComPedidoHoje = new Set(
      pedidos.filter((p) => p.status !== "cancelado" && p.data_pedido === hoje).map((p) => p.pousada_id),
    )
    return pousadas.filter((p) => !pousadasComPedidoHoje.has(p.id))
  }, [pedidos, pousadas])

  return {
    periodo,
    pousadasSelecionadas,
    pedidos,
    pousadas,
    filtrados,
    ativos,
    totais,
    totaisAnteriores,
    serie,
    porUnidade,
    porPousada,
    pendencias,
    isLoading,
    mutate,
  }
}
