"use client"

import { useState } from "react"
import { Star, ShoppingBasket, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function FeedbackForm({ token, jaAvaliado }: { token: string; jaAvaliado: boolean }) {
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(jaAvaliado)

  const enviar = async () => {
    if (nota < 1) {
      toast.error("Escolha uma nota de 1 a 5 estrelas")
      return
    }
    setEnviando(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nota, comentario: comentario.trim() }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(dados?.error || "Não foi possível enviar sua avaliação.")
      setEnviado(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar sua avaliação.")
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
        <p className="font-heading text-lg font-semibold text-card-foreground">Obrigado pela avaliação!</p>
        <p className="text-sm text-muted-foreground">Seu feedback ajuda a melhorar o café da manhã.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="tap p-1"
              aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-9 transition-colors",
                  (hover || nota) >= n ? "fill-primary text-primary" : "fill-muted text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Toque nas estrelas para avaliar</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Comentário (opcional)</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Conte como foi a cesta que você recebeu..."
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <Button onClick={enviar} disabled={enviando} className="tap min-h-11 gap-2">
        <ShoppingBasket className="size-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </div>
  )
}
