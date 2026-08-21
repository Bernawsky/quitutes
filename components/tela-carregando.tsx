/** Tela de carregamento do portal de pedidos, com o vídeo da cesta passando por cima do texto. */
export function TelaCarregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 size-full object-cover"
        src="/videos/cesta-de-cafe-da-manha.mp4"
      />
      <div className="absolute inset-0 bg-background/40" />
      <p className="relative font-heading text-sm font-semibold text-foreground drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
        {texto}
      </p>
    </div>
  )
}
