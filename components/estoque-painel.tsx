"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Boxes, Minus, Plus, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EstoqueItem } from "@/lib/estoque"
import { ajustarEstoque, criarItemEstoque, removerItemEstoque } from "@/app/actions/estoque"

export function EstoquePainel({ itensIniciais }: { itensIniciais: EstoqueItem[] }) {
  const [itens, setItens] = useState(itensIniciais)
  const [nome, setNome] = useState("")
  const [unidade, setUnidade] = useState("un")
  const [minima, setMinima] = useState(0)
  const [salvando, setSalvando] = useState(false)

  const recarregarLocal = (id: number, delta: number) => {
    setItens((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantidade_atual: Math.max(0, it.quantidade_atual + delta) } : it)),
    )
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar aos pedidos"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold text-card-foreground">Controle de estoque</h1>
            <p className="text-sm text-muted-foreground">Insumos usados nas cestas de café da manhã</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <form
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto_auto_auto]"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!nome.trim() || salvando) return
            setSalvando(true)
            try {
              await criarItemEstoque({ nome: nome.trim(), unidade: unidade.trim() || "un", quantidadeAtual: 0, quantidadeMinima: minima })
              setItens((prev) => [
                ...prev,
                { id: Date.now(), nome: nome.trim(), unidade: unidade.trim() || "un", quantidade_atual: 0, quantidade_minima: minima, atualizado_em: new Date().toISOString() },
              ])
              setNome("")
              setMinima(0)
            } finally {
              setSalvando(false)
            }
          }}
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Novo item (ex: Ovos, Café em pó...)"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <input
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="un"
            className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <input
            type="number"
            min={0}
            value={minima}
            onChange={(e) => setMinima(Number(e.target.value))}
            placeholder="Mínimo"
            className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <Button type="submit" disabled={!nome.trim() || salvando}>
            Adicionar
          </Button>
        </form>

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Boxes className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum item cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">Adicione os insumos usados nas cestas acima.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {itens.map((item) => {
              const baixo = item.quantidade_atual <= item.quantidade_minima
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border p-4",
                    baixo ? "border-destructive/40 bg-destructive/5" : "border-border bg-card",
                  )}
                >
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-card-foreground">
                      {baixo && <AlertTriangle className="size-3.5 text-destructive" aria-hidden="true" />}
                      {item.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {item.quantidade_minima} {item.unidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        recarregarLocal(item.id, -1)
                        await ajustarEstoque(item.id, -1)
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:border-primary/50"
                      aria-label={`Diminuir ${item.nome}`}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-14 text-center text-sm font-semibold tabular-nums">
                      {item.quantidade_atual} {item.unidade}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        recarregarLocal(item.id, 1)
                        await ajustarEstoque(item.id, 1)
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:border-primary/50"
                      aria-label={`Aumentar ${item.nome}`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setItens((prev) => prev.filter((it) => it.id !== item.id))
                        await removerItemEstoque(item.id)
                      }}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label={`Remover ${item.nome}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
