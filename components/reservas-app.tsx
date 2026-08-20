"use client"

import { useEffect, useMemo, useState } from "react"
import { ShoppingBasket, Send, MessageCircle, BarChart3, Copy, Check, AlertTriangle, Boxes } from "lucide-react"
import Link from "next/link"
import { PousadaCard, type PousadaPedido } from "@/components/pousada-card"
import { Button } from "@/components/ui/button"
import { LINK_GRUPO, descreverItens, type UnidadePedido } from "@/lib/pedidos"
import { POUSADAS, HORA_LIMITE_PEDIDO } from "@/lib/pousadas"
import { salvarPedido } from "@/app/actions/pedidos"

function dataHoje() {
  const d = new Date()
  const dia = String(d.getDate()).padStart(2, "0")
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  return `${dia}/${mes}`
}

function novoQuarto() {
  return { quartoId: crypto.randomUUID(), quarto: "", pessoas: 0, itens: {} as Record<string, number> }
}

function criarPousadasPedido(): PousadaPedido[] {
  return POUSADAS.map((pousada) => ({
    pousada,
    horario: pousada.horarioPadrao,
    quartos: [novoQuarto()],
  }))
}

export function ReservasApp() {
  const [saudacao, setSaudacao] = useState(`Olá cestas de café da manhã ${dataHoje()}`)
  const [pousadas, setPousadas] = useState<PousadaPedido[]>(criarPousadasPedido)
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [foraDoPrazo, setForaDoPrazo] = useState(false)

  useEffect(() => {
    setForaDoPrazo(new Date().getHours() >= HORA_LIMITE_PEDIDO)
  }, [])

  const handleHorario = (pousadaId: string, horario: string) => {
    setPousadas((prev) => prev.map((p) => (p.pousada.id === pousadaId ? { ...p, horario } : p)))
    setCopiado(false)
  }

  const handleAdicionarQuarto = (pousadaId: string) => {
    setPousadas((prev) =>
      prev.map((p) => (p.pousada.id === pousadaId ? { ...p, quartos: [...p.quartos, novoQuarto()] } : p)),
    )
  }

  const handleRemoverQuarto = (pousadaId: string, quartoId: string) => {
    setPousadas((prev) =>
      prev.map((p) =>
        p.pousada.id === pousadaId ? { ...p, quartos: p.quartos.filter((q) => q.quartoId !== quartoId) } : p,
      ),
    )
  }

  const handleQuarto = (pousadaId: string, quartoId: string, quarto: string) => {
    setPousadas((prev) =>
      prev.map((p) =>
        p.pousada.id === pousadaId
          ? { ...p, quartos: p.quartos.map((q) => (q.quartoId === quartoId ? { ...q, quarto } : q)) }
          : p,
      ),
    )
    setCopiado(false)
  }

  const handlePessoas = (pousadaId: string, quartoId: string, pessoas: number) => {
    setPousadas((prev) =>
      prev.map((p) =>
        p.pousada.id === pousadaId
          ? { ...p, quartos: p.quartos.map((q) => (q.quartoId === quartoId ? { ...q, pessoas } : q)) }
          : p,
      ),
    )
    setCopiado(false)
  }

  const handleItem = (pousadaId: string, quartoId: string, key: string, qtd: number) => {
    setPousadas((prev) =>
      prev.map((p) => {
        if (p.pousada.id !== pousadaId) return p
        return {
          ...p,
          quartos: p.quartos.map((q) => {
            if (q.quartoId !== quartoId) return q
            const itens = { ...q.itens }
            if (qtd > 0) itens[key] = qtd
            else delete itens[key]
            return { ...q, itens }
          }),
        }
      }),
    )
    setCopiado(false)
  }

  const handleLimpar = (pousadaId: string) => {
    setPousadas((prev) =>
      prev.map((p) => (p.pousada.id === pousadaId ? { ...p, quartos: [novoQuarto()] } : p)),
    )
  }

  const handleLimparTudo = () => {
    setPousadas(criarPousadasPedido())
    setCopiado(false)
  }

  const unidadesAtivas = useMemo<UnidadePedido[]>(() => {
    const lista: UnidadePedido[] = []
    for (const p of pousadas) {
      for (const q of p.quartos) {
        if (q.quarto.trim() || q.pessoas > 0 || Object.values(q.itens).some((v) => v > 0)) {
          lista.push({
            pousadaId: p.pousada.id,
            pousada: p.pousada.nome,
            quarto: q.quarto.trim(),
            horario: p.horario,
            pessoas: q.pessoas,
            itens: q.itens,
          })
        }
      }
    }
    return lista
  }, [pousadas])

  const mensagem = useMemo(() => {
    const linhas: string[] = []
    if (saudacao.trim()) linhas.push(saudacao.trim())

    for (const u of unidadesAtivas) {
      const partes: string[] = [u.pousada]
      if (u.quarto) partes.push(`(${u.quarto})`)
      partes.push(`às ${u.horario}`)
      const detalhes: string[] = []
      if (u.pessoas > 0) detalhes.push(`${u.pessoas} ${u.pessoas === 1 ? "pessoa" : "pessoas"}`)
      detalhes.push(...descreverItens(u.itens))
      let linha = partes.join(" ")
      if (detalhes.length > 0) linha += ` — ${detalhes.join(", ")}`
      linhas.push(linha)
    }

    return linhas.join("\n")
  }, [saudacao, unidadesAtivas])

  const podeEnviar = unidadesAtivas.length > 0

  const handleConcluir = async () => {
    if (!podeEnviar || enviando) return
    setEnviando(true)
    try {
      try {
        await navigator.clipboard.writeText(mensagem)
        setCopiado(true)
      } catch {
        setCopiado(false)
      }

      const { id } = await salvarPedido({ titulo: saudacao.trim(), saudacao: saudacao.trim(), unidades: unidadesAtivas })

      // Abre a folha de logística em A4 (com QR de feedback) já pronta para impressão.
      window.open(`/logistica/${id}`, "_blank", "noopener,noreferrer")

      // Redireciona para o grupo do WhatsApp (cole a mensagem manualmente)
      window.open(LINK_GRUPO, "_blank", "noopener,noreferrer")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBasket className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-bold text-card-foreground text-balance">
              Sistema de Pedidos
            </h1>
            <p className="text-sm text-muted-foreground">Monte os pedidos por pousada e envie no grupo do WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {foraDoPrazo && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              O prazo para pedidos de cestas do dia seguinte é até as {HORA_LIMITE_PEDIDO}h. Pedidos feitos agora podem
              não ser atendidos amanhã.
            </span>
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-border bg-card p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Saudação / Data</span>
            <input
              type="text"
              value={saudacao}
              onChange={(e) => {
                setSaudacao(e.target.value)
                setCopiado(false)
              }}
              placeholder="Ex: Olá cestas de café da manhã 07/08"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pousadas.map((pedido) => (
            <PousadaCard
              key={pedido.pousada.id}
              pedido={pedido}
              onHorario={handleHorario}
              onAdicionarQuarto={handleAdicionarQuarto}
              onRemoverQuarto={handleRemoverQuarto}
              onQuarto={handleQuarto}
              onPessoas={handlePessoas}
              onItem={handleItem}
              onLimpar={handleLimpar}
            />
          ))}
        </div>
      </main>

      {/* Atalhos flutuantes para métricas e estoque */}
      <div className="fixed bottom-24 right-4 z-10 flex flex-col items-end gap-2 sm:bottom-28">
        <Link
          href="/estoque"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground shadow-lg transition-colors hover:bg-secondary"
          aria-label="Abrir controle de estoque"
        >
          <Boxes className="size-4 text-primary" aria-hidden="true" />
          Estoque
        </Link>
        <Link
          href="/metricas"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground shadow-lg transition-colors hover:bg-secondary"
          aria-label="Abrir dashboard de métricas"
        >
          <BarChart3 className="size-4 text-primary" aria-hidden="true" />
          Métricas
        </Link>
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            {copiado ? (
              <>
                <Copy className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Mensagem copiada! Cole no grupo do WhatsApp.</span>
              </>
            ) : (
              <>
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {unidadesAtivas.length > 0
                    ? `${unidadesAtivas.length} ${unidadesAtivas.length === 1 ? "quarto pronto" : "quartos prontos"} para envio`
                    : "Preencha ao menos um quarto para enviar"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unidadesAtivas.length > 0 && (
              <Button variant="ghost" onClick={handleLimparTudo} disabled={enviando}>
                Limpar tudo
              </Button>
            )}
            <Button
              onClick={handleConcluir}
              disabled={!podeEnviar || enviando}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Concluir, copiar mensagem, gerar logística e abrir o grupo"
            >
              {copiado ? <Check className="size-4" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              {enviando ? "Enviando..." : "Concluir"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
