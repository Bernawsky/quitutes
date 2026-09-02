"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Wheat, Plus, Minus, Trash2, Printer, Info, CalendarPlus, FileDown, Save, Eraser, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarioMulti } from "@/components/calendario-multi"
import { cn } from "@/lib/utils"
import { getRascunho, salvarRascunho, concluirProducao } from "@/lib/producao-api"
import { exportarProducaoPDF } from "@/lib/export-producao"
import {
  PAES,
  RECEITAS,
  agruparPorTipo,
  buscarPao,
  calcularBatidas,
  calcularIngredientes,
  calcularLatas,
  formatarDiaProducao,
  formatarPeso,
  novoDia,
  novoItem,
  type DiaProducao,
  type ItemProducao,
  type TipoMassa,
} from "@/lib/producao"

function Stepper({ valor, onChange, rotulo }: { valor: number; onChange: (v: number) => void; rotulo: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, valor - 1))}
        disabled={valor <= 0}
        aria-label={`Diminuir ${rotulo}`}
        className="tap flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 active:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={valor === 0 ? "" : valor}
        onChange={(e) => onChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
        placeholder="0"
        aria-label={rotulo}
        className="h-8 w-14 rounded-lg border border-input bg-background text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        aria-label={`Aumentar ${rotulo}`}
        className="tap flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 active:bg-muted"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function BadgeMassa({ tipo }: { tipo: TipoMassa }) {
  return (
    <span className="shrink-0 rounded-md bg-accent/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
      {RECEITAS[tipo].nome}
    </span>
  )
}

function TabelaIngredientes({ tipo, pesoG }: { tipo: TipoMassa; pesoG: number }) {
  const ingredientes = calcularIngredientes(tipo, pesoG)
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {ingredientes.map((i) => (
        <li key={i.chave} className="flex items-center justify-between gap-2 py-1.5 text-sm">
          <span className="text-foreground">{i.nome}</span>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatarPeso(i.gramas)}</span>
        </li>
      ))}
    </ul>
  )
}

function GrupoDoDia({ tipo, pesoTotalG, itens }: { tipo: TipoMassa; pesoTotalG: number; itens: ItemProducao[] }) {
  const batidas = calcularBatidas(pesoTotalG)
  const totalLatas = itens.reduce((soma, i) => soma + calcularLatas(i), 0)

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
        <h3 className="font-heading text-sm font-semibold text-foreground">{RECEITAS[tipo].nome}</h3>
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
          {formatarPeso(pesoTotalG)} de massa
        </span>
      </div>

      {batidas.numero > 1 && (
        <p className="mb-2.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent-foreground">
          Bater {batidas.numero}x na amassadeira · {formatarPeso(batidas.pesoPorBatidaG)} por batida
        </p>
      )}

      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {batidas.numero > 1 ? "Ingredientes por batida" : "Ingredientes"}
      </p>
      <TabelaIngredientes tipo={tipo} pesoG={batidas.pesoPorBatidaG} />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-border/60 pt-2">
        <p className="text-xs text-muted-foreground">{itens.map((i) => `${i.unidades}un ${i.sabor}`).join(" · ")}</p>
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
          {totalLatas} {totalLatas === 1 ? "assadeira" : "assadeiras"}
        </span>
      </div>
    </div>
  )
}

function LinhaItem({
  item,
  onChange,
  onRemover,
}: {
  item: ItemProducao
  onChange: (item: ItemProducao) => void
  onRemover: () => void
}) {
  const latas = calcularLatas(item)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2.5 print:hidden">
      <div className="flex items-center gap-2">
        <Select
          value={item.sabor}
          onValueChange={(v) => {
            if (!v) return
            const pao = buscarPao(v)
            onChange({ ...item, sabor: pao.nome, tipo: pao.tipo, pesoUnidadeG: pao.pesoUnidadeG })
          }}
        >
          <SelectTrigger className="h-9 min-w-0 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAES.map((p) => (
              <SelectItem key={p.nome} value={p.nome}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <BadgeMassa tipo={item.tipo} />
        <button
          type="button"
          onClick={onRemover}
          aria-label="Remover item"
          className="tap flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Unidade:</span>
          <Stepper valor={item.unidades} onChange={(v) => onChange({ ...item, unidades: v })} rotulo="unidades" />
        </div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Peso:
          <input
            type="number"
            min={1}
            value={item.pesoUnidadeG}
            onChange={(e) => onChange({ ...item, pesoUnidadeG: Math.max(1, Number(e.target.value) || 0) })}
            className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-xs font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          g
        </label>
        <span className="ml-auto rounded-md bg-muted px-1.5 py-1 text-xs font-medium text-muted-foreground">
          {latas} {latas === 1 ? "assadeira" : "assadeiras"}
        </span>
      </div>
    </div>
  )
}

export function CardDia({
  dia,
  onChange,
  onRemover,
}: {
  dia: DiaProducao
  onChange: (dia: DiaProducao) => void
  onRemover: () => void
}) {
  const grupos = agruparPorTipo(dia.itens)

  const atualizarItem = (item: ItemProducao) => {
    onChange({ ...dia, itens: dia.itens.map((i) => (i.id === item.id ? item : i)) })
  }
  const removerItem = (id: string) => {
    onChange({ ...dia, itens: dia.itens.filter((i) => i.id !== id) })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 print:break-inside-avoid">
      <div className="mb-4 flex items-center gap-2">
        <p className="font-heading min-w-0 flex-1 text-base font-semibold text-card-foreground">{formatarDiaProducao(dia.data)}</p>
        <Button variant="ghost" size="sm" onClick={onRemover} className="tap shrink-0 gap-1.5 text-destructive print:hidden">
          <Trash2 className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Remover dia</span>
        </Button>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground print:hidden">Nenhum item adicionado ainda.</p>
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {grupos.map((g) => (
            <GrupoDoDia key={g.tipo} tipo={g.tipo} pesoTotalG={g.pesoTotalG} itens={g.itens} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 print:hidden">
        {dia.itens.map((item) => (
          <LinhaItem key={item.id} item={item} onChange={atualizarItem} onRemover={() => removerItem(item.id)} />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...dia, itens: [...dia.itens, novoItem()] })}
          className="tap w-fit gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar item
        </Button>
      </div>
    </section>
  )
}

export function ProducaoCalculadora() {
  const [dias, setDias] = useState<DiaProducao[]>([])
  const [carregado, setCarregado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [calendarioAberto, setCalendarioAberto] = useState(false)
  const [salvandoProducao, setSalvandoProducao] = useState(false)
  const [popupAberto, setPopupAberto] = useState(false)
  const timeoutSalvar = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getRascunho()
      .then((rascunho) => setDias(rascunho))
      .catch(() => {})
      .finally(() => setCarregado(true))
  }, [])

  useEffect(() => {
    if (!carregado) return
    setSalvando(true)
    if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current)
    timeoutSalvar.current = setTimeout(() => {
      salvarRascunho(dias)
        .catch(() => {})
        .finally(() => setSalvando(false))
    }, 800)
    return () => {
      if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias, carregado])

  const totaisSemana = agruparPorTipo(dias.flatMap((d) => d.itens))

  const atualizarDia = (dia: DiaProducao) => setDias((atual) => atual.map((d) => (d.id === dia.id ? dia : d)))
  const removerDia = (id: string) => setDias((atual) => atual.filter((d) => d.id !== id))

  function aplicarSelecaoDias(datas: string[]) {
    setDias((atual) => {
      const existentesPorData = new Map(atual.map((d) => [d.data, d]))
      return datas.map((data) => existentesPorData.get(data) ?? novoDia(data)).sort((a, b) => a.data.localeCompare(b.data))
    })
    setCalendarioAberto(false)
  }

  function limparTudo() {
    if (dias.length === 0) return
    if (!window.confirm("Limpar tudo? Isso apaga o rascunho atual sem salvar no histórico.")) return
    setDias([])
  }

  async function salvar() {
    if (dias.length === 0) return
    if (timeoutSalvar.current) clearTimeout(timeoutSalvar.current)
    setSalvandoProducao(true)
    try {
      await concluirProducao(dias)
      setPopupAberto(true)
    } catch {
      window.alert("Não foi possível salvar agora. Verifique a conexão e tente de novo.")
    } finally {
      setSalvandoProducao(false)
    }
  }

  function fecharPopup() {
    setPopupAberto(false)
    setDias([])
  }

  function gerarPDFDoPopup() {
    exportarProducaoPDF(dias)
    setPopupAberto(false)
    setDias([])
  }

  function imprimirDoPopup() {
    setPopupAberto(false)
    window.print()
    const aoTerminar = () => {
      setDias([])
      window.removeEventListener("afterprint", aoTerminar)
    }
    window.addEventListener("afterprint", aoTerminar)
  }

  return (
    <div className="min-h-svh bg-background pb-16 print:pb-0">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wheat className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl font-bold text-card-foreground">Planejamento de Produção</h1>
              <p className="text-sm text-muted-foreground">
                Divide a produção por dia e calcula os ingredientes da massa base
                {salvando && <span className="ml-2 text-xs text-muted-foreground/70">Salvando…</span>}
              </p>
            </div>
            <Link
              href="/producao/historico"
              className="tap flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <History className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={() => setCalendarioAberto(true)} className="tap gap-2">
              <CalendarPlus className="size-4" aria-hidden="true" />
              Selecionar dias
            </Button>
            <Button variant="outline" onClick={limparTudo} disabled={dias.length === 0} className="tap gap-2">
              <Eraser className="size-4" aria-hidden="true" />
              Limpar tudo
            </Button>
            <Button onClick={salvar} disabled={dias.length === 0 || salvandoProducao} className="tap col-span-2 gap-2 sm:col-span-1">
              <Save className="size-4" aria-hidden="true" />
              {salvandoProducao ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <CalendarioMulti
        aberto={calendarioAberto}
        onFechar={() => setCalendarioAberto(false)}
        selecionadas={dias.map((d) => d.data)}
        onConcluir={aplicarSelecaoDias}
      />

      <Dialog open={popupAberto} onOpenChange={(aberto) => !aberto && fecharPopup()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Produção salva!</DialogTitle>
            <DialogDescription>O que você quer fazer agora?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={gerarPDFDoPopup} className="tap justify-start gap-2">
              <FileDown className="size-4" aria-hidden="true" />
              Gerar PDF
            </Button>
            <Button variant="outline" onClick={imprimirDoPopup} className="tap justify-start gap-2">
              <Printer className="size-4" aria-hidden="true" />
              Imprimir
            </Button>
            <Button variant="ghost" onClick={fecharPopup} className="tap justify-start gap-2">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="mb-4 hidden font-heading text-lg font-bold text-foreground print:block">Planejamento de Produção</p>

        {!carregado ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : dias.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center print:hidden">
            <Wheat className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhum dia selecionado</p>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Selecione pelo menos 1 dia no calendário pra começar o planejamento.
            </p>
            <Button onClick={() => setCalendarioAberto(true)} className="tap gap-2">
              <CalendarPlus className="size-4" aria-hidden="true" />
              Selecionar dias de produção
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-900">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                O cálculo cobre só a <b>massa base</b> de cada receita. Ingredientes de recheio/cobertura por sabor (canela,
                chocolate, doce de leite, queijo, etc.) não entram na conta — as proporções deles não foram informadas.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {dias.map((dia) => (
                <CardDia key={dia.id} dia={dia} onChange={atualizarDia} onRemover={() => removerDia(dia.id)} />
              ))}
            </div>

            {totaisSemana.length > 0 && (
              <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 print:break-inside-avoid">
                <h2 className={cn("mb-4 font-heading text-base font-semibold text-card-foreground")}>
                  Total do período (todos os dias somados)
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {totaisSemana.map((g) => (
                    <div key={g.tipo} className="rounded-xl border border-border bg-background p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-heading text-sm font-semibold text-foreground">{RECEITAS[g.tipo].nome}</h3>
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                          {formatarPeso(g.pesoTotalG)}
                        </span>
                      </div>
                      <TabelaIngredientes tipo={g.tipo} pesoG={g.pesoTotalG} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
