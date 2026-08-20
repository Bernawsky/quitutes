"use client"

import { useState } from "react"
import { Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { enviarFeedback } from "@/app/actions/feedback"

export function FeedbackForm({ pedidoId }: { pedidoId: number }) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
        <Check className="size-8 text-primary" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-card-foreground">Obrigado pelo feedback!</p>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (nota === 0 || enviando) return
        setEnviando(true)
        try {
          await enviarFeedback({ pedidoId, nota, comentario: comentario.trim() || undefined })
          setEnviado(true)
        } finally {
          setEnviando(false)
        }
      }}
    >
      <div className="flex items-center justify-center gap-1" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={nota === valor}
            onClick={() => setNota(valor)}
            aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`}
          >
            <Star
              className={cn("size-8", valor <= nota ? "fill-primary text-primary" : "text-muted-foreground")}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Algum comentário? (opcional)"
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <Button type="submit" disabled={nota === 0 || enviando} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {enviando ? "Enviando..." : "Enviar feedback"}
      </Button>
    </form>
  )
}
