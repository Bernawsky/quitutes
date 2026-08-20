"use client"

import { useMemo, useState } from "react"
import { ShoppingBasket, Send, MessageCircle, Copy, Check, AlertCircle, LogOut } from "lucide-react"
import { toast } from "sonner"
import { UnidadeCard, type Unidade } from "@/components/unidade-card"
import { Button } from "@/components/ui/button"
import { LINK_GRUPO, dataSaudacao, gerarMensagem, type UnidadePedido } from "@/lib/pedidos"
import { salvarPedido } from "@/lib/pedidos-api"
import type { Pousada } from "@/lib/pousadas"

function criarUnidades(pousada: Pousada): Unidade[] {
  return pousada.unidades.map((u, i) => ({
    id: i + 1,
    nome: u.nome,
    ...(u.isSuite ? { isSuite: true } : {}),
    horario: "",
    pessoas: 0,
    itens: {} as Record<string, number>,
    dietas: [] as string[],
    observacao: "",
  }))
}

/**
 * Pousadas com um único horário disponível têm o horário fixo: só é gravado no
 * estado da unidade quando ela passa a ter algo preenchido (evita que todas as
 * unidades apareçam como "ativas" só porque o horário já vem definido).
 */
function comHorarioFixo(pousada: Pousada, u: Unidade): string {
  return pousada.horarios.length === 1 && !u.horario ? pousada.horarios[0]! : u.horario
}

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
  const [saudacao, setSaudacao] = useState(dataSaudacao())
  const [unidades, setUnidades] = useState<Unidade[]>(() => criarUnidades(pousada))
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [mostrarErros, setMostrarErros] = useState(false)

  const handleHorario = (id: number, horario: string) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario } : u)))
    setCopiado(false)
  }

  const handlePessoas = (id: number, pessoas: number) => {
    setUnidades((prev) =>
      prev.map((u) => (u.id === id ? { ...u, pessoas, horario: pessoas > 0 ? comHorarioFixo(pousada, u) : u.horario } : u)),
    )
    setCopiado(false)
  }

  const handleItem = (id: number, key: string, qtd: number) => {
    setUnidades((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const itens = { ...u.itens }
        if (qtd > 0) itens[key] = qtd
        else delete itens[key]
        return { ...u, itens, horario: qtd > 0 ? comHorarioFixo(pousada, u) : u.horario }
      }),
    )
    setCopiado(false)
  }

  const handleDieta = (id: number, key: string, ativo: boolean) => {
    setUnidades((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const dietas = ativo ? Array.from(new Set([...(u.dietas ?? []), key])) : (u.dietas ?? []).filter((d) => d !== key)
        return { ...u, dietas, horario: ativo ? comHorarioFixo(pousada, u) : u.horario }
      }),
    )
    setCopiado(false)
  }

  const handleObservacao = (id: number, texto: string) => {
    setUnidades((prev) =>
      prev.map((u) => (u.id === id ? { ...u, observacao: texto, horario: texto.trim() ? comHorarioFixo(pousada, u) : u.horario } : u)),
    )
    setCopiado(false)
  }

  const handleLimpar = (id: number) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario: "", pessoas: 0, itens: {}, dietas: [], observacao: "" } : u)))
  }

  const handleLimparTudo = () => {
    setUnidades(criarUnidades(pousada))
    setCopiado(false)
    setMostrarErros(false)
  }

  const unidadesAtivas = useMemo(
    () =>
      unidades.filter(
        (u) => u.horario || u.pessoas > 0 || Object.values(u.itens).some((q) => q > 0) || (u.dietas?.length ?? 0) > 0 || u.observacao?.trim(),
      ),
    [unidades],
  )

  // Regra: toda unidade selecionada precisa de horário E quantidade de pessoas
  const unidadesInvalidas = useMemo(() => unidadesAtivas.filter((u) => !u.horario || !(u.pessoas > 0)), [unidadesAtivas])

  const payload: UnidadePedido[] = useMemo(
    () =>
      unidadesAtivas.map((u) => ({
        unidade: u.nome,
        horario: u.horario,
        pessoas: u.pessoas,
        itens: u.itens,
        dietas: u.dietas ?? [],
        observacao: u.observacao?.trim() ?? "",
      })),
    [unidadesAtivas],
  )

  const mensagem = useMemo(() => gerarMensagem(saudacao, payload), [saudacao, payload])

  const podeEnviar = unidadesAtivas.length > 0 && unidadesInvalidas.length === 0

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
    void salvarPedido({ titulo: saudacao.trim(), saudacao: saudacao.trim(), unidades: payload, pousada: pousada.nome })
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
            <Button variant="ghost" onClick={onSair} className="gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          )}
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
              placeholder="Ex: ☕Olá, café para segunda-feira 07/08/25"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>

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

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
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
