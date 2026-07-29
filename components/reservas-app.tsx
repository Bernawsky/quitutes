"use client"

import { useMemo, useState } from "react"
import { Home, Send, Phone, MessageCircle } from "lucide-react"
import { ChaleCard, type Chale } from "@/components/chale-card"
import { Button } from "@/components/ui/button"

const NUMERO_PADRAO = "553284104719"

function criarChales(): Chale[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    nome: `Chalé ${i + 1}`,
    horario: "",
    pessoas: "",
    observacoes: "",
  }))
}

export function ReservasApp() {
  const [saudacao, setSaudacao] = useState("Boa tarde!!!")
  const [titulo, setTitulo] = useState("Cafés")
  const [numero, setNumero] = useState(NUMERO_PADRAO)
  const [chales, setChales] = useState<Chale[]>(criarChales)

  const handleChange = (id: number, campo: keyof Chale, valor: string) => {
    setChales((prev) => prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)))
  }

  const handleLimpar = (id: number) => {
    setChales((prev) =>
      prev.map((c) => (c.id === id ? { ...c, horario: "", pessoas: "", observacoes: "" } : c)),
    )
  }

  const handleLimparTudo = () => {
    setChales(criarChales())
  }

  const chalesAtivos = useMemo(
    () => chales.filter((c) => c.horario || c.pessoas || c.observacoes),
    [chales],
  )

  const mensagem = useMemo(() => {
    const linhas: string[] = []
    if (saudacao.trim()) linhas.push(saudacao.trim())
    if (titulo.trim()) linhas.push(titulo.trim())

    for (const c of chalesAtivos) {
      const partes: string[] = [c.nome]
      if (c.pessoas.trim()) partes.push(`com ${c.pessoas.trim()} pessoas`)
      if (c.horario.trim()) partes.push(`às ${c.horario.trim()}`)
      let linha = partes.join(" ")
      if (c.observacoes.trim()) linha += ` — ${c.observacoes.trim()}`
      linhas.push(linha)
    }

    return linhas.join("\n")
  }, [saudacao, titulo, chalesAtivos])

  const numeroLimpo = numero.replace(/\D/g, "")
  const podeEnviar = chalesAtivos.length > 0 && numeroLimpo.length >= 10

  const handleConcluir = () => {
    if (!podeEnviar) return
    const url = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="min-h-svh bg-background pb-40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Home className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-bold text-card-foreground text-balance">
              Sistema de Reservas
            </h1>
            <p className="text-sm text-muted-foreground">Preencha os chalés e envie pelo WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Saudação</span>
            <input
              type="text"
              value={saudacao}
              onChange={(e) => setSaudacao(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Título / Data</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Cafés de quinta 30/07"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Phone className="size-3.5" aria-hidden="true" />
              WhatsApp de destino
            </span>
            <input
              type="tel"
              inputMode="tel"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 5532984104719"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chales.map((chale) => (
            <ChaleCard key={chale.id} chale={chale} onChange={handleChange} onLimpar={handleLimpar} />
          ))}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {chalesAtivos.length > 0
                ? `${chalesAtivos.length} ${chalesAtivos.length === 1 ? "chalé pronto" : "chalés prontos"} para envio`
                : "Preencha ao menos um chalé para enviar"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {chalesAtivos.length > 0 && (
              <Button variant="ghost" onClick={handleLimparTudo}>
                Limpar tudo
              </Button>
            )}
            <Button
              onClick={handleConcluir}
              disabled={!podeEnviar}
              className="gap-2"
              aria-label="Concluir e enviar pelo WhatsApp"
            >
              <Send className="size-4" aria-hidden="true" />
              Concluir
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
