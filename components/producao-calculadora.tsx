"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wheat,
  Plus,
  Minus,
  Trash2,
  Printer,
  Info,
  CalendarPlus,
  FileDown,
  Save,
  Eraser,
  History,
  CheckCircle2,
  Croissant,
  CakeSlice,
  ChevronDown,
  Check,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarioMulti } from "@/components/calendario-multi"
import { cn } from "@/lib/utils"
import { getRascunho, salvarRascunho, concluirProducao } from "@/lib/producao-api"
import { exportarProducaoPDF, imprimirProducaoPDF } from "@/lib/export-producao"
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
  novoDiaVazio,
  novoItem,
  novoItemDe,
  TIPOS_MASSA,
  type DiaProducao,
  type ItemProducao,
  type Pao,
  type TipoMassa,
} from "@/lib/producao"

function Stepper({ valor, onChange, rotulo }: { valor: number; onChange: (v: number) => void; rotulo: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => onChange(Math.max(0, valor - 1))}
        disabled={valor <= 0}
        aria-label={`Diminuir ${rotulo}`}
        className="tap flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 active:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </motion.button>
      <div className="relative h-8 w-14 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.input
            key={valor}
            type="number"
            inputMode="numeric"
            min={0}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.14 }}
            value={valor === 0 ? "" : valor}
            onChange={(e) => onChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
            placeholder="0"
            aria-label={rotulo}
            className="absolute inset-0 h-8 w-14 rounded-lg border border-input bg-background text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </AnimatePresence>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => onChange(valor + 1)}
        aria-label={`Aumentar ${rotulo}`}
        className="tap flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 active:bg-muted"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </motion.button>
    </div>
  )
}

const ICONE_MASSA: Record<TipoMassa, typeof Wheat> = {
  massa_doce: Wheat,
  pao_abobora: CakeSlice,
  brioche: Croissant,
}

function IconeMassa({ tipo, className }: { tipo: TipoMassa; className?: string }) {
  const Icone = ICONE_MASSA[tipo] ?? Wheat
  return <Icone className={className} aria-hidden="true" />
}

/**
 * Grade de pães agrupada por tipo de massa, com animação de entrada escalonada por grupo.
 * Reaproveitada no picker de cada item (SeletorPao) e no pop-up de primeiro item do dia.
 */
function GradePaes({ valorAtual, onEscolher }: { valorAtual?: string; onEscolher: (pao: Pao) => void }) {
  const grupos = TIPOS_MASSA.filter((t) => PAES.some((p) => p.tipo === t.valor))

  return (
    <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pb-1">
      {grupos.map((grupo, indiceGrupo) => (
        <motion.div
          key={grupo.valor}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: indiceGrupo * 0.05 }}
        >
          <p className="mb-1.5 px-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{grupo.nome}</p>
          <div className="flex flex-col gap-1">
            {PAES.filter((p) => p.tipo === grupo.valor).map((p) => {
              const selecionado = p.nome === valorAtual
              return (
                <motion.button
                  key={p.nome}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEscolher(p)}
                  className={cn(
                    "tap flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selecionado
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted/60 hover:border-primary/30 hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      selecionado ? "bg-primary text-primary-foreground" : "bg-background text-primary",
                    )}
                  >
                    <IconeMassa tipo={p.tipo} className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{p.nome}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Scale className="size-3" aria-hidden="true" />
                      {p.pesoUnidadeG}g
                    </span>
                  </span>
                  {selecionado && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Picker de pão em cards (em vez de um <select> nativo): abre numa folha com os pães agrupados
 * por tipo de massa, cada um com ícone, peso e um check no selecionado — pensado pra ficar fácil
 * de bater o olho e escolher no tablet da cozinha, sem parecer um formulário de admin genérico.
 */
function SeletorPao({ valor, onEscolher }: { valor: string; onEscolher: (pao: Pao) => void }) {
  const [aberto, setAberto] = useState(false)
  const paoAtual = buscarPao(valor)

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="tap group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-input bg-background py-1.5 pr-3 pl-1.5 text-left transition-colors hover:border-primary/50 active:bg-muted"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconeMassa tipo={paoAtual.tipo} className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{paoAtual.nome}</span>
          <span className="block text-xs text-muted-foreground">
            {RECEITAS[paoAtual.tipo].nome} · {paoAtual.pesoUnidadeG}g
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground"
          aria-hidden="true"
        />
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Escolher pão</DialogTitle>
            <DialogDescription>Toque num pão pra trocar o item.</DialogDescription>
          </DialogHeader>
          <GradePaes
            valorAtual={valor}
            onEscolher={(p) => {
              onEscolher(p)
              setAberto(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
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
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-background p-4"
    >
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
    </motion.div>
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
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-background p-2.5 print:hidden"
    >
      <div className="flex items-center gap-2">
        <SeletorPao
          valor={item.sabor}
          onEscolher={(pao) => onChange({ ...item, sabor: pao.nome, tipo: pao.tipo, pesoUnidadeG: pao.pesoUnidadeG })}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={onRemover}
          aria-label="Remover item"
          className="tap flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </motion.button>
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
    </motion.div>
  )
}

export function CardDia({
  dia,
  onChange,
  onRemover,
  indice = 0,
}: {
  dia: DiaProducao
  onChange: (dia: DiaProducao) => void
  onRemover: () => void
  indice?: number
}) {
  const grupos = agruparPorTipo(dia.itens)

  const atualizarItem = (item: ItemProducao) => {
    onChange({ ...dia, itens: dia.itens.map((i) => (i.id === item.id ? item : i)) })
  }
  const removerItem = (id: string) => {
    onChange({ ...dia, itens: dia.itens.filter((i) => i.id !== id) })
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, delay: Math.min(indice, 6) * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5 print:break-inside-avoid"
    >
      <div className="mb-4 flex items-center gap-2">
        <p className="font-heading min-w-0 flex-1 text-base font-semibold text-card-foreground">{formatarDiaProducao(dia.data)}</p>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" onClick={onRemover} className="tap shrink-0 gap-1.5 text-destructive print:hidden">
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Remover dia</span>
          </Button>
        </motion.div>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground print:hidden">Nenhum item adicionado ainda.</p>
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {grupos.map((g) => (
              <GrupoDoDia key={g.tipo} tipo={g.tipo} pesoTotalG={g.pesoTotalG} itens={g.itens} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-col gap-2 print:hidden">
        <AnimatePresence initial={false}>
          {dia.itens.map((item) => (
            <LinhaItem key={item.id} item={item} onChange={atualizarItem} onRemover={() => removerItem(item.id)} />
          ))}
        </AnimatePresence>
        <motion.div whileTap={{ scale: 0.97 }} className="w-fit">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...dia, itens: [...dia.itens, novoItem()] })}
            className="tap w-fit gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Adicionar item
          </Button>
        </motion.div>
      </div>
    </motion.section>
  )
}

export function ProducaoCalculadora() {
  const [dias, setDias] = useState<DiaProducao[]>([])
  const [carregado, setCarregado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [calendarioAberto, setCalendarioAberto] = useState(false)
  const [salvandoProducao, setSalvandoProducao] = useState(false)
  const [popupAberto, setPopupAberto] = useState(false)
  const [escolhaInicialAberta, setEscolhaInicialAberta] = useState(false)
  const [datasNovas, setDatasNovas] = useState<string[]>([])
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
    const existentesPorData = new Map(dias.map((d) => [d.data, d]))
    const novasDatas = datas.filter((data) => !existentesPorData.has(data))
    // Dia novo nasce sem item nenhum — a escolha de qual pão entra primeiro é feita no pop-up
    // logo em seguida, em vez de já cair em Massa doce/Pão de Canela por padrão.
    const resultado = datas
      .map((data) => existentesPorData.get(data) ?? novoDiaVazio(data))
      .sort((a, b) => a.data.localeCompare(b.data))

    setDias(resultado)
    setCalendarioAberto(false)

    if (novasDatas.length > 0) {
      setDatasNovas(novasDatas)
      setEscolhaInicialAberta(true)
    }
  }

  function escolherPrimeiroItem(pao: Pao) {
    setDias((atual) =>
      atual.map((dia) => (datasNovas.includes(dia.data) ? { ...dia, itens: [novoItemDe(pao)] } : dia)),
    )
    setEscolhaInicialAberta(false)
    setDatasNovas([])
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
    imprimirProducaoPDF(dias)
    setPopupAberto(false)
    setDias([])
  }

  return (
    <div className="min-h-svh bg-background pb-16 print:pb-0">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5">
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <Wheat className="size-5" aria-hidden="true" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl font-bold text-card-foreground">Planejamento de Produção</h1>
              <p className="text-sm text-muted-foreground">
                Divide a produção por dia e calcula os ingredientes da massa base
                <AnimatePresence>
                  {salvando && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-2 text-xs text-muted-foreground/70"
                    >
                      Salvando…
                    </motion.span>
                  )}
                </AnimatePresence>
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
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button variant="outline" onClick={() => setCalendarioAberto(true)} className="tap gap-2">
                <CalendarPlus className="size-4" aria-hidden="true" />
                Selecionar dias
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button variant="outline" onClick={limparTudo} disabled={dias.length === 0} className="tap gap-2">
                <Eraser className="size-4" aria-hidden="true" />
                Limpar tudo
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }} className="col-span-2 sm:col-span-1">
              <Button
                onClick={salvar}
                disabled={dias.length === 0 || salvandoProducao}
                className="tap w-full gap-2"
              >
                <Save className="size-4" aria-hidden="true" />
                {salvandoProducao ? "Salvando…" : "Salvar"}
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <CalendarioMulti
        aberto={calendarioAberto}
        onFechar={() => setCalendarioAberto(false)}
        selecionadas={dias.map((d) => d.data)}
        onConcluir={aplicarSelecaoDias}
      />

      <Dialog open={escolhaInicialAberta} onOpenChange={(aberto) => !aberto && setEscolhaInicialAberta(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
              className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <Croissant className="size-5" aria-hidden="true" />
            </motion.span>
            <DialogTitle>Qual vai ser o primeiro pão?</DialogTitle>
            <DialogDescription>
              {datasNovas.length === 1
                ? `Escolhe o primeiro item de ${formatarDiaProducao(datasNovas[0]).toLowerCase()}.`
                : `Escolhe o primeiro item pros ${datasNovas.length} dias que você acabou de adicionar.`}
            </DialogDescription>
          </DialogHeader>
          <GradePaes onEscolher={escolherPrimeiroItem} />
        </DialogContent>
      </Dialog>

      <Dialog open={popupAberto} onOpenChange={(aberto) => !aberto && fecharPopup()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
              className="mb-1 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </motion.span>
            <DialogTitle className="font-heading">Produção salva!</DialogTitle>
            <DialogDescription>O que você quer fazer agora?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={gerarPDFDoPopup} className="tap w-full justify-start gap-2">
                <FileDown className="size-4" aria-hidden="true" />
                Gerar PDF
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={imprimirDoPopup} className="tap w-full justify-start gap-2">
                <Printer className="size-4" aria-hidden="true" />
                Imprimir
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button variant="ghost" onClick={fecharPopup} className="tap w-full justify-start gap-2">
                Fechar
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="mb-4 hidden font-heading text-lg font-bold text-foreground print:block">Planejamento de Produção</p>

        {!carregado ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : dias.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-dashed border-border bg-card p-10 text-center print:hidden"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Wheat className="size-7 text-primary" aria-hidden="true" />
            </motion.div>
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhum dia selecionado</p>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Selecione pelo menos 1 dia no calendário pra começar o planejamento.
            </p>
            <motion.div whileTap={{ scale: 0.96 }} className="inline-block">
              <Button onClick={() => setCalendarioAberto(true)} className="tap gap-2">
                <CalendarPlus className="size-4" aria-hidden="true" />
                Selecionar dias de produção
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-5 flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-900"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                O cálculo cobre só a <b>massa base</b> de cada receita. Ingredientes de recheio/cobertura por sabor (canela,
                chocolate, doce de leite, queijo, etc.) não entram na conta — as proporções deles não foram informadas.
              </p>
            </motion.div>

            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {dias.map((dia, indice) => (
                  <CardDia key={dia.id} dia={dia} indice={indice} onChange={atualizarDia} onRemover={() => removerDia(dia.id)} />
                ))}
              </AnimatePresence>
            </div>

            {totaisSemana.length > 0 && (
              <motion.section
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 print:break-inside-avoid"
              >
                <h2 className={cn("mb-4 font-heading text-base font-semibold text-card-foreground")}>
                  Total do período (todos os dias somados)
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnimatePresence initial={false}>
                    {totaisSemana.map((g) => (
                      <motion.div
                        layout
                        key={g.tipo}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-heading text-sm font-semibold text-foreground">{RECEITAS[g.tipo].nome}</h3>
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                            {formatarPeso(g.pesoTotalG)}
                          </span>
                        </div>
                        <TabelaIngredientes tipo={g.tipo} pesoG={g.pesoTotalG} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
