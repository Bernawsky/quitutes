import { Loader2 } from "lucide-react"

/** Tela de carregamento simples: um spinner em loop por cima do texto (sem vídeo). */
export function TelaCarregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  )
}
