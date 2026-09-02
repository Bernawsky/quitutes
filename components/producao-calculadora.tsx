"use client"

import { useState } from "react"
import { Wheat, Plus, Minus, Trash2, Printer, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DIAS_EXEMPLO,
  RECEITAS,
  TIPOS_MASSA,
  agruparPorTipo,
  calcularBatidas,
  calcularIngredientes,
  calcularLatas,
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
      <span className="w-10 text-center text-sm font-semibold tabular-nums text-foreground" aria-live="polite">
        {valor}
      </span>
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
    <div className="rounded-xl border border-border bg-background p-4 print:border-none print:p-0">
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
        <p className="text-xs text-muted-foreground">
          {itens.map((i) => `${i.unidades}un ${i.sabor !== "—" ? i.sabor : ""} (${i.pesoUnidadeG}g)`.trim()).join(" · ")}
        </p>
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
        <Select value={item.tipo} onValueChange={(v) => v && onChange({ ...item, tipo: v as TipoMassa })}>
          <SelectTrigger className="h-9 w-32 shrink-0 text-xs sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_MASSA.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="text"
          value={item.sabor}
          onChange={(e) => onChange({ ...item, sabor: e.target.value })}
          placeholder="Sabor"
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
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
        <Stepper valor={item.unidades} onChange={(v) => onChange({ ...item, unidades: v })} rotulo="unidades" />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          peso un.
          <input
            type="number"
            min={1}
            value={item.pesoUnidadeG}
            onChange={(e) => onChange({ ...item, pesoUnidadeG: Math.max(1, Number(e.target.value) || 0) })}
            className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
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

function CardDia({
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
    <section className="rounded-2xl border border-border bg-card p-5 print:border-none print:p-0 print:shadow-none print:break-inside-avoid">
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={dia.nome}
          onChange={(e) => onChange({ ...dia, nome: e.target.value })}
          className="font-heading min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 text-base font-semibold text-card-foreground outline-none focus:border-input focus:bg-background focus:px-2 print:hidden"
        />
        <p className="hidden font-heading text-base font-semibold text-card-foreground print:block">{dia.nome}</p>
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
  const [dias, setDias] = useState<DiaProducao[]>(DIAS_EXEMPLO)

  const totaisSemana = agruparPorTipo(dias.flatMap((d) => d.itens))

  const atualizarDia = (dia: DiaProducao) => setDias((atual) => atual.map((d) => (d.id === dia.id ? dia : d)))
  const removerDia = (id: string) => setDias((atual) => atual.filter((d) => d.id !== id))
  const adicionarDia = () => setDias((atual) => [...atual, novoDia(`Dia ${atual.length + 1}`)])

  return (
    <div className="min-h-svh bg-background pb-16 print:pb-0">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wheat className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold text-card-foreground">Planejamento de Produção</h1>
              <p className="text-sm text-muted-foreground">Divide a produção por dia e calcula os ingredientes da massa base</p>
            </div>
          </div>
          <div className="flex gap-2 sm:ml-auto sm:shrink-0">
            <Button variant="outline" onClick={adicionarDia} className="tap flex-1 gap-2 sm:flex-none">
              <Plus className="size-4" aria-hidden="true" />
              Adicionar dia
            </Button>
            <Button onClick={() => window.print()} className="tap flex-1 gap-2 sm:flex-none">
              <Printer className="size-4" aria-hidden="true" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="mb-4 hidden font-heading text-lg font-bold text-foreground print:block">Planejamento de Produção</p>

        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-900 print:border print:border-border print:bg-transparent print:text-foreground">
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

        {dias.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Wheat className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhum dia adicionado</p>
            <p className="mt-1 text-sm text-muted-foreground">Clique em &quot;Adicionar dia&quot; pra começar o planejamento.</p>
          </div>
        )}

        {totaisSemana.length > 0 && (
          <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 print:break-inside-avoid print:border-border print:bg-transparent">
            <h2 className={cn("mb-4 font-heading text-base font-semibold text-card-foreground")}>
              Total da semana (todos os dias somados)
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
      </main>
    </div>
  )
}
