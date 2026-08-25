"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type Periodo = "dia" | "semana" | "mes" | "ano"

/**
 * Filtros de período (único) e pousadas (múltiplas) guardados na URL — assim
 * ficam sincronizados entre as páginas de métricas (visão geral, pedidos,
 * histórico) sem precisar de contexto/estado global.
 */
export function useFiltrosMetricas() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const periodo = (searchParams.get("periodo") as Periodo | null) ?? "semana"
  const pousadasSelecionadas = useMemo(() => {
    const raw = searchParams.get("pousadas")
    return raw ? raw.split(",").filter(Boolean) : []
  }, [searchParams])

  const atualizarParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [chave, valor] of Object.entries(patch)) {
        if (valor === null || valor === "") params.delete(chave)
        else params.set(chave, valor)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setPeriodo = useCallback((p: Periodo) => atualizarParams({ periodo: p === "semana" ? null : p }), [atualizarParams])

  const togglePousada = useCallback(
    (nome: string) => {
      const atual = new Set(pousadasSelecionadas)
      if (atual.has(nome)) atual.delete(nome)
      else atual.add(nome)
      atualizarParams({ pousadas: atual.size > 0 ? Array.from(atual).join(",") : null })
    },
    [pousadasSelecionadas, atualizarParams],
  )

  const limparPousadas = useCallback(() => atualizarParams({ pousadas: null }), [atualizarParams])

  return { periodo, setPeriodo, pousadasSelecionadas, togglePousada, limparPousadas }
}
