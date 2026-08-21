"use client"

import { useEffect, useState } from "react"

const CHAVE = "quitutes.splash.ultima-data"

/** Controla se o splash de marca (vídeo completo) já foi mostrado hoje neste navegador. */
export function useSplashDiario() {
  const [mostrarSplash, setMostrarSplash] = useState(false)
  const [splashVerificado, setSplashVerificado] = useState(false)

  useEffect(() => {
    try {
      const hoje = new Date().toDateString()
      const ultima = window.localStorage.getItem(CHAVE)
      if (ultima !== hoje) setMostrarSplash(true)
    } catch {
      // localStorage indisponível: apenas não mostra o splash
    } finally {
      setSplashVerificado(true)
    }
  }, [])

  const concluirSplash = () => {
    try {
      window.localStorage.setItem(CHAVE, new Date().toDateString())
    } catch {
      /* ignora */
    }
    setMostrarSplash(false)
  }

  return { mostrarSplash, splashVerificado, concluirSplash }
}
