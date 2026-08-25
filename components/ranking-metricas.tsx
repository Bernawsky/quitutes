"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type ItemRanking = { rotulo: string; valor: number; sub?: string }

/** Widget único com abas para alternar entre "por unidade" e "por pousada" — evita repetir o mesmo layout de barras duas vezes na tela. */
export function RankingMetricas({ porUnidade, porPousada }: { porUnidade: ItemRanking[]; porPousada: ItemRanking[] }) {
  const [aba, setAba] = useState<"unidade" | "pousada">("pousada")
  const itens = aba === "pousada" ? porPousada : porUnidade
  const max = itens[0]?.valor ?? 0

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold text-card-foreground">Ranking</h2>
        <div className="inline-flex rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setAba("pousada")}
            className={cn(
              "tap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              aba === "pousada" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Por pousada
          </button>
          <button
            type="button"
            onClick={() => setAba("unidade")}
            className={cn(
              "tap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              aba === "unidade" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Por unidade
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {itens.map((item) => (
            <li key={item.rotulo} className="flex items-center gap-2.5">
              <span className="w-20 shrink-0 truncate text-xs font-medium text-card-foreground" title={item.rotulo}>
                {item.rotulo}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-secondary">
                <div
                  className="h-full rounded-md bg-accent transition-[width] duration-300"
                  style={{ width: `${max ? (item.valor / max) * 100 : 0}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {item.valor}
                {item.sub ? ` • ${item.sub}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
