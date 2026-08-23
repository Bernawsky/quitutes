import { ShoppingBasket } from "lucide-react"

/** Tela de carregamento com a marca pulsando — leve, sem vídeo, sem loop pesado. */
export function TelaCarregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ShoppingBasket className="size-6 animate-pulse" aria-hidden="true" />
        <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/50 [animation-duration:1.8s]" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{texto}</p>
    </div>
  )
}
