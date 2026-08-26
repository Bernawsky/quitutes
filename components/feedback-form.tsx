"use client"

import { useState } from "react"
import { Send, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function FeedbackForm({ token, jaAvaliado }: { token: string; jaAvaliado: boolean }) {
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(jaAvaliado)

  const enviar = async () => {
    if (!nome.trim()) {
      toast.error("Informe seu nome")
      return
    }
    if (!comentario.trim()) {
      toast.error("Escreva seu feedback")
      return
    }
    setEnviando(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nome: nome.trim(), whatsapp: whatsapp.trim(), comentario: comentario.trim() }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(dados?.error || "Não foi possível enviar seu feedback.")
      setEnviado(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar seu feedback.")
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <p className="font-heading text-lg font-semibold text-card-foreground">Obrigado pelo feedback!</p>
        <p className="text-sm text-muted-foreground">Sua opinião ajuda a melhorar o café da manhã.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value.slice(0, 120))}
          placeholder="Seu nome"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">WhatsApp (opcional)</span>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.slice(0, 30))}
          placeholder="(00) 00000-0000"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Feedback</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Conte como foi a cesta que você recebeu..."
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <Button onClick={enviar} disabled={enviando} className="tap min-h-11 gap-2">
        <Send className="size-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar feedback"}
      </Button>
    </div>
  )
}
