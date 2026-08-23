"use client"

import { useRef, useState } from "react"
import { SkipForward } from "lucide-react"

/** Splash de marca: toca o vídeo por inteiro, uma vez (sem loop), na primeira visita do dia. */
export function SplashBranding({ onConcluir }: { onConcluir: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progresso, setProgresso] = useState(0)
  const [pronto, setPronto] = useState(false)

  const atualizarProgresso = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgresso((v.currentTime / v.duration) * 100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onCanPlay={() => setPronto(true)}
        onTimeUpdate={atualizarProgresso}
        onEnded={onConcluir}
        onError={onConcluir}
        className="size-full object-cover transition-opacity duration-500"
        style={{ opacity: pronto ? 1 : 0 }}
        src="/videos/cesta-de-cafe-da-manha.mp4"
      />

      {/* Vinheta inferior para legibilidade da barra/botão sobre qualquer cena do vídeo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Barra de progresso do vídeo */}
      <div className="safe-bottom absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-8">
        <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white transition-[width] duration-150 ease-linear" style={{ width: `${progresso}%` }} />
        </div>

        <button
          type="button"
          onClick={onConcluir}
          className="tap flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md active:bg-white/25"
        >
          Pular
          <SkipForward className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
