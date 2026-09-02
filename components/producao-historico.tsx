"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, FileDown, History, ChevronDown, Pencil, Trash2, Save, X, Printer } from "lucide-react"
import { getProducoesConcluidas, atualizarProducaoConcluida, excluirProducao, type ProducaoConcluida } from "@/lib/producao-api"
import { exportarProducaoPDF } from "@/lib/export-producao"
import {
  agruparPorTipo,
  calcularBatidas,
  calcularIngredientes,
  calcularLatas,
  formatarDiaProducao,
  formatarPeso,
  RECEITAS,
  type DiaProducao,
} from "@/lib/producao"
import { CardDia } from "@/components/producao-calculadora"
import { cn } from "@/lib/utils"

function rotuloPeriodo(producao: ProducaoConcluida): string {
  const datas = producao.dias.map((d) => d.data).sort()
  if (datas.length === 0) return "Sem dias"
  const inicio = formatarDiaProducao(datas[0])
  if (datas.length === 1) return inicio
  const fim = formatarDiaProducao(datas[datas.length - 1])
  return `${inicio} até ${fim}`
}

function DetalheProducao({ producao }: { producao: ProducaoConcluida }) {
  return (
    <div className="mt-3 flex flex-col gap-4 border-t border-border/60 pt-3">
      {[...producao.dias]
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((dia) => (
          <div key={dia.id}>
            <p className="mb-2 font-heading text-sm font-semibold text-foreground">{formatarDiaProducao(dia.data)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {agruparPorTipo(dia.itens).map((g) => {
                const batidas = calcularBatidas(g.pesoTotalG)
                const totalLatas = g.itens.reduce((soma, i) => soma + calcularLatas(i), 0)
                return (
                  <div key={g.tipo} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                      <h4 className="font-heading text-sm font-semibold text-foreground">{RECEITAS[g.tipo].nome}</h4>
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                        {formatarPeso(g.pesoTotalG)}
                      </span>
                    </div>
                    {batidas.numero > 1 && (
                      <p className="mb-2 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent-foreground">
                        Bateu {batidas.numero}x · {formatarPeso(batidas.pesoPorBatidaG)} por batida
                      </p>
                    )}
                    <ul className="mb-2 flex flex-col divide-y divide-border/60">
                      {calcularIngredientes(g.tipo, batidas.pesoPorBatidaG).map((i) => (
                        <li key={i.chave} className="flex items-center justify-between gap-2 py-1 text-sm">
                          <span className="text-foreground">{i.nome}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatarPeso(i.gramas)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                      <span>{g.itens.map((i) => `${i.unidades}un ${i.sabor}`).join(" · ")}</span>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                        {totalLatas} {totalLatas === 1 ? "assadeira" : "assadeiras"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}

function ItemHistorico({ producao, onMudou }: { producao: ProducaoConcluida; onMudou: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [diasEditados, setDiasEditados] = useState<DiaProducao[]>(producao.dias)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)

  useEffect(() => {
    if (!imprimindo) return
    window.print()
    const aoTerminar = () => {
      setImprimindo(false)
      window.removeEventListener("afterprint", aoTerminar)
    }
    window.addEventListener("afterprint", aoTerminar)
  }, [imprimindo])

  function iniciarEdicao() {
    setDiasEditados(producao.dias)
    setEditando(true)
    setAberto(true)
  }

  function cancelarEdicao() {
    setEditando(false)
  }

  async function salvarEdicao() {
    setSalvando(true)
    try {
      await atualizarProducaoConcluida(producao.id, diasEditados)
      setEditando(false)
      onMudou()
    } catch {
      window.alert("Não foi possível salvar as alterações agora. Verifique a conexão e tente de novo.")
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!window.confirm("Excluir essa produção do histórico? Não tem como desfazer.")) return
    setExcluindo(true)
    try {
      await excluirProducao(producao.id)
      onMudou()
    } catch {
      window.alert("Não foi possível excluir agora. Verifique a conexão e tente de novo.")
      setExcluindo(false)
    }
  }

  const atualizarDiaEditado = (dia: DiaProducao) => setDiasEditados((atual) => atual.map((d) => (d.id === dia.id ? dia : d)))
  const removerDiaEditado = (id: string) => setDiasEditados((atual) => atual.filter((d) => d.id !== id))

  return (
    <details
      open={aberto}
      onToggle={(e) => setAberto(e.currentTarget.open)}
      data-imprimir-ativo={imprimindo ? "" : undefined}
      className="producao-historico-item rounded-2xl border border-border bg-card p-5 print:break-inside-avoid"
    >
      <summary
        onClick={(e) => {
          if (editando) e.preventDefault()
        }}
        className="flex list-none items-center gap-3 [&::-webkit-details-marker]:hidden marker:content-none cursor-pointer"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform print:hidden", aberto && "rotate-180")}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-heading truncate text-sm font-semibold text-card-foreground">{rotuloPeriodo(producao)}</p>
            <p className="text-xs text-muted-foreground">
              Concluído em {new Date(producao.concluido_em).toLocaleString("pt-BR")}
            </p>
          </div>
        </span>
        <div onClick={(e) => e.stopPropagation()} className="flex shrink-0 items-center gap-2 print:hidden">
          {editando ? (
            <>
              <button
                type="button"
                onClick={cancelarEdicao}
                disabled={salvando}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button
                type="button"
                onClick={salvarEdicao}
                disabled={salvando}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{salvando ? "Salvando…" : "Salvar"}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAberto(true)
                  setImprimindo(true)
                }}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => exportarProducaoPDF(producao.dias, { titulo: `Produção — ${rotuloPeriodo(producao)}` })}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              >
                <FileDown className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Gerar PDF</span>
              </button>
              <button
                type="button"
                onClick={iniciarEdicao}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                type="button"
                onClick={excluir}
                disabled={excluindo}
                className="tap flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{excluindo ? "Excluindo…" : "Excluir"}</span>
              </button>
            </>
          )}
        </div>
      </summary>

      {editando ? (
        <div className="mt-3 flex flex-col gap-4 border-t border-border/60 pt-3 print:hidden">
          {diasEditados.map((dia) => (
            <CardDia key={dia.id} dia={dia} onChange={atualizarDiaEditado} onRemover={() => removerDiaEditado(dia.id)} />
          ))}
        </div>
      ) : (
        <DetalheProducao producao={producao} />
      )}
    </details>
  )
}

export function ProducaoHistorico() {
  const { data: producoes = [], isLoading, mutate } = useSWR("producoes-concluidas", getProducoesConcluidas)

  return (
    <div className="min-h-svh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <History className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Histórico de Produção</h1>
            <p className="text-sm text-muted-foreground">Produções já concluídas</p>
          </div>
          <Link
            href="/producao"
            className="tap flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : producoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <History className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhuma produção concluída ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando você concluir uma produção em <Link href="/producao" className="underline">/producao</Link>, ela aparece aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {producoes.map((p) => (
              <ItemHistorico key={p.id} producao={p} onMudou={() => mutate()} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
