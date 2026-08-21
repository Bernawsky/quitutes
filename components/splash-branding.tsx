"use client"

/** Splash de marca: toca o vídeo por inteiro, uma vez (sem loop), na primeira visita do dia. */
export function SplashBranding({ onConcluir }: { onConcluir: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <video
        autoPlay
        muted
        playsInline
        onEnded={onConcluir}
        onError={onConcluir}
        className="size-full object-cover"
        src="/videos/cesta-de-cafe-da-manha.mp4"
      />
      <button
        type="button"
        onClick={onConcluir}
        className="absolute bottom-6 right-6 rounded-full bg-background/80 px-4 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
      >
        Pular
      </button>
    </div>
  )
}
