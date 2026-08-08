"use client"

import { useMemo, useState } from "react"
import { ShoppingBasket, Send, MessageCircle, BarChart3, Copy, Check } from "lucide-react"
import Link from "next/link"
import { UnidadeCard, type Unidade } from "@/components/unidade-card"
import { Button } from "@/components/ui/button"
import { LINK_GRUPO, type UnidadePedido } from "@/lib/pedidos"
import { salvarPedido } from "@/app/actions/pedidos"

function dataHoje() {
  const d = new Date()
  const dia = String(d.getDate()).padStart(2, "0")
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  return `${dia}/${mes}`
}

function criarUnidades(): Unidade[] {
  const chales = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    nome: `Chalé ${i + 1}`,
    horario: "",
    pessoas: 0,
    observacoes: [] as string[],
  }))
  return [...chales, { id: 11, nome: "Suíte", isSuite: true, horario: "", pessoas: 0, observacoes: [] }]
}

export function ReservasApp() {
  const [saudacao, setSaudacao] = useState(`Olá cestas de café da manhã ${dataHoje()}`)
  const [unidades, setUnidades] = useState<Unidade[]>(criarUnidades)
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const handleHorario = (id: number, horario: string) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario } : u)))
    setCopiado(false)
  }

  const handlePessoas = (id: number, pessoas: number) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, pessoas } : u)))
    setCopiado(false)
  }

  const handleToggleObs = (id: number, obs: string) => {
    setUnidades((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              observacoes: u.observacoes.includes(obs)
                ? u.observacoes.filter((o) => o !== obs)
                : [...u.observacoes, obs],
            }
          : u,
      ),
    )
    setCopiado(false)
  }

  const handleLimpar = (id: number) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario: "", pessoas: 0, observacoes: [] } : u)))
  }

  const handleLimparTudo = () => {
    setUnidades(criarUnidades())
    setCopiado(false)
  }

  const unidadesAtivas = useMemo(
    () => unidades.filter((u) => u.horario || u.pessoas > 0 || u.observacoes.length > 0),
    [unidades],
  )

  const mensagem = useMemo(() => {
    const linhas: string[] = []
    if (saudacao.trim()) linhas.push(saudacao.trim())

    for (const u of unidadesAtivas) {
      const partes: string[] = [u.nome]
      if (u.horario) partes.push(`às ${u.horario}`)
      let linha = partes.join(" ")
      if (u.pessoas > 0) linha += ` — ${u.pessoas} ${u.pessoas === 1 ? "pessoa" : "pessoas"}`
      if (u.observacoes.length > 0) linha += `${u.pessoas > 0 ? "," : " —"} ${u.observacoes.join(", ")}`
      linhas.push(linha)
    }

    return linhas.join("\n")
  }, [saudacao, unidadesAtivas])

  const podeEnviar = unidadesAtivas.length > 0

  const handleConcluir = async () => {
    if (!podeEnviar || enviando) return
    setEnviando(true)
    try {
      // Copia a mensagem para a área de transferência
      try {
        await navigator.clipboard.writeText(mensagem)
        setCopiado(true)
      } catch {
        setCopiado(false)
      }

      // Salva o pedido no banco para o dashboard de métricas
      const payload: UnidadePedido[] = unidadesAtivas.map((u) => ({
        unidade: u.nome,
        horario: u.horario,
        pessoas: u.pessoas,
        observacoes: u.observacoes,
      }))
      await salvarPedido({ titulo: saudacao.trim(), saudacao: saudacao.trim(), unidades: payload })

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
            <p className="text-sm text-muted-foreground">Monte os pedidos e envie no grupo do WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
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
          {unidades.map((unidade) => (
            <UnidadeCard
              key={unidade.id}
              unidade={unidade}
              onHorario={handleHorario}
              onPessoas={handlePessoas}
              onToggleObs={handleToggleObs}
              onLimpar={handleLimpar}
            />
          ))}
        </div>
      </main>

      {/* Botão flutuante para o dashboard de métricas */}
      <Link
        href="/metricas"
        className="fixed bottom-24 right-4 z-10 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground shadow-lg transition-colors hover:bg-secondary sm:bottom-28"
        aria-label="Abrir dashboard de métricas"
      >
        <BarChart3 className="size-4 text-primary" aria-hidden="true" />
        Métricas
      </Link>

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
                    ? `${unidadesAtivas.length} ${unidadesAtivas.length === 1 ? "unidade pronta" : "unidades prontas"} para envio`
                    : "Preencha ao menos uma unidade para enviar"}
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
              aria-label="Concluir, copiar mensagem e abrir o grupo"
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
