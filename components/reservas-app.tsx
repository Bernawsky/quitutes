"use client"

import { useMemo, useState } from "react"
import { ShoppingBasket, Send, MessageCircle, Copy, Check, AlertCircle, LogOut, ListChecks, CalendarDays, MessageSquareHeart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { UnidadeCard } from "@/components/unidade-card"
import { MeusPedidos } from "@/components/meus-pedidos"
import { FeedbacksLista } from "@/components/feedbacks-lista"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendario } from "@/components/calendario"
import { useUnidadesPedido } from "@/hooks/use-unidades-pedido"
import { LINK_GRUPO, dataSaudacaoPara, gerarMensagem, hojeISO, amanhaISO, rotuloData } from "@/lib/pedidos"
import { salvarPedido } from "@/lib/pedidos-api"
import type { Pousada } from "@/lib/pousadas"

/**
 * Copia de forma síncrona dentro do gesto do usuário.
 * Usa a Clipboard API quando disponível e cai para execCommand("copy")
 * quando o navegador bloqueia ou não suporta a API.
 */
export function copiarTexto(texto: string): boolean {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(texto).catch(() => copiarFallback(texto))
      return true
    }
  } catch {
    /* segue para o fallback */
  }
  return copiarFallback(texto)
}

export function copiarFallback(texto: string): boolean {
  try {
    const area = document.createElement("textarea")
    area.value = texto
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.top = "-1000px"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, texto.length)
    const ok = document.execCommand("copy")
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function ReservasApp({ pousada, onSair }: { pousada: Pousada; onSair?: () => void }) {
  const [aba, setAba] = useState<"novo" | "meus" | "feedbacks">("novo")
  const [saudacao, setSaudacao] = useState(dataSaudacaoPara(amanhaISO()))
  const [saudacaoEditada, setSaudacaoEditada] = useState(false)
  const [dataPedido, setDataPedido] = useState(amanhaISO())
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [mostrarErros, setMostrarErros] = useState(false)

  // Enquanto a pessoa não mexer no texto, a saudação acompanha a data escolhida em "Café para".
  const mudarDataPedido = (novaData: string) => {
    setDataPedido(novaData)
    if (!saudacaoEditada) setSaudacao(dataSaudacaoPara(novaData))
    setCopiado(false)
  }

  const {
    unidades,
    handleHorario,
    handlePessoas,
    handleItem,
    handleDieta,
    handleObservacao,
    handleLimpar,
    handleLimparTudo,
    unidadesAtivas,
    unidadesInvalidas,
    payload,
    podeEnviar,
  } = useUnidadesPedido(pousada)

  const mensagem = useMemo(() => gerarMensagem(saudacao, payload), [saudacao, payload])

  const handleConcluir = () => {
    if (enviando) return

    if (unidadesAtivas.length === 0) {
      setMostrarErros(true)
      toast.error("Preencha ao menos uma unidade para enviar")
      return
    }

    // Validação obrigatória: horário e pessoas em todas as unidades selecionadas
    if (unidadesInvalidas.length > 0) {
      setMostrarErros(true)
      toast.error("Preencha horário e quantidade de pessoas", {
        description: `Pendente em: ${unidadesInvalidas.map((u) => u.nome).join(", ")}`,
      })
      return
    }

    setMostrarErros(false)
    setEnviando(true)

    // 1) Cópia acontece dentro do gesto do usuário (evita bloqueio do navegador)
    const copiouOk = copiarTexto(mensagem)
    setCopiado(copiouOk)

    if (copiouOk) {
      toast.success("Copiado para a área de transferência", {
        description: "Abrindo o grupo do WhatsApp. É só colar a mensagem.",
      })
    } else {
      toast.error("Não foi possível copiar automaticamente", {
        description: "Copie a mensagem manualmente antes de enviar no grupo.",
      })
    }

    // 2) Salva o pedido para o dashboard de métricas
    void salvarPedido({
      titulo: saudacao.trim(),
      saudacao: saudacao.trim(),
      unidades: payload,
      pousadaId: pousada.id,
      pousada: pousada.nome,
      dataPedido,
    })
      .catch(() => {
        toast.error("Não foi possível registrar o pedido nas métricas")
      })
      .finally(() => {
        setEnviando(false)
      })

    // 3) Pequena pausa e redireciona para o grupo do WhatsApp
    window.setTimeout(() => {
      const aba = window.open(LINK_GRUPO, "_blank", "noopener,noreferrer")
      if (!aba) window.location.href = LINK_GRUPO
    }, 1200)
  }

  return (
    <div className="min-h-svh bg-background pb-40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBasket className="size-5" aria-hidden="true" />
          </span>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-balance text-card-foreground">{pousada.nome}</h1>
            <p className="text-sm text-muted-foreground">{pousada.subtitulo}</p>
          </div>
          {onSair && (
            <Button variant="ghost" onClick={onSair} className="tap gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          )}
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-4">
          <div className="relative grid grid-cols-3 rounded-xl bg-muted p-1">
            <span
              className="absolute inset-y-1 w-[calc(33.333%-5.5px)] rounded-lg bg-primary shadow-sm transition-transform duration-300 ease-out"
              style={{
                transform:
                  aba === "meus"
                    ? "translateX(calc(100% + 8px))"
                    : aba === "feedbacks"
                      ? "translateX(calc(200% + 16px))"
                      : "translateX(0)",
              }}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setAba("novo")}
              className={cn(
                "tap relative z-10 flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                aba === "novo" ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              Novo pedido
            </button>
            <button
              type="button"
              onClick={() => setAba("meus")}
              className={cn(
                "tap relative z-10 flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                aba === "meus" ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <ListChecks className="size-3.5" aria-hidden="true" />
              Meus pedidos
            </button>
            <button
              type="button"
              onClick={() => setAba("feedbacks")}
              className={cn(
                "tap relative z-10 flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                aba === "feedbacks" ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <MessageSquareHeart className="size-3.5" aria-hidden="true" />
              Feedbacks
            </button>
          </div>
        </div>
      </header>

      {aba === "meus" ? (
        <main className="mx-auto max-w-5xl px-4 py-6">
          <MeusPedidos pousada={pousada} />
        </main>
      ) : aba === "feedbacks" ? (
        <main className="mx-auto max-w-5xl px-4 py-6">
          <FeedbacksLista />
        </main>
      ) : (
        <>
          <main className="mx-auto max-w-5xl px-4 py-6">
            <section className="mb-6 rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Saudação / Data</span>
                  <input
                    type="text"
                    value={saudacao}
                    onChange={(e) => {
                      setSaudacao(e.target.value)
                      setSaudacaoEditada(true)
                      setCopiado(false)
                    }}
                    placeholder="Ex: ☕Olá, café para segunda-feira 07/08/25"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Café para</span>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button variant="outline" className="tap justify-start gap-2 sm:min-w-40">
                          <CalendarDays className="size-4" aria-hidden="true" />
                          {rotuloData(dataPedido)}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto">
                      <Calendario
                        valor={dataPedido}
                        minimo={hojeISO()}
                        onSelecionar={mudarDataPedido}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {unidadesAtivas.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Prévia da mensagem do WhatsApp</p>
                  <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-3 text-xs whitespace-pre-wrap text-foreground">
                    {mensagem}
                  </pre>
                </div>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unidades.map((unidade) => (
                <UnidadeCard
                  key={unidade.id}
                  unidade={unidade}
                  horarios={pousada.horarios}
                  mostrarErros={mostrarErros || unidadesInvalidas.length > 0}
                  onHorario={handleHorario}
                  onPessoas={handlePessoas}
                  onItem={handleItem}
                  onDieta={handleDieta}
                  onObservacao={handleObservacao}
                  onLimpar={handleLimpar}
                />
              ))}
            </div>
          </main>

          <footer className="safe-bottom fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                {copiado ? (
                  <>
                    <Copy className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>Mensagem copiada! Cole no grupo do WhatsApp.</span>
                  </>
                ) : unidadesInvalidas.length > 0 ? (
                  <>
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                    <span>Informe horário e pessoas em: {unidadesInvalidas.map((u) => u.nome).join(", ")}</span>
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
                  <Button variant="ghost" onClick={handleLimparTudo} disabled={enviando} className="tap">
                    Limpar tudo
                  </Button>
                )}
                <Button
                  onClick={handleConcluir}
                  disabled={!podeEnviar || enviando}
                  className="tap min-h-11 flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:flex-none"
                  aria-label="Concluir, copiar mensagem e abrir o grupo"
                >
                  {copiado ? <Check className="size-4" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                  {enviando ? "Enviando..." : "Concluir"}
                </Button>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}
