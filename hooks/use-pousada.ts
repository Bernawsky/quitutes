"use client"

import { useCallback, useEffect, useState } from "react"
import { POUSADAS, pousadaPorSlug, type Pousada } from "@/lib/pousadas"

const CHAVE = "quitutes.pousada"

/** Sessão simples da pousada, persistida no navegador (mantém o usuário logado). */
export function usePousada() {
  const [pousada, setPousada] = useState<Pousada | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    try {
      const slug = window.localStorage.getItem(CHAVE)
      setPousada(pousadaPorSlug(slug))
    } catch {
      setPousada(null)
    }
    setCarregando(false)
  }, [])

  const entrar = useCallback((p: Pousada) => {
    try {
      window.localStorage.setItem(CHAVE, p.slug)
    } catch {
      /* ignora storage indisponível */
    }
    setPousada(p)
  }, [])

  const sair = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE)
    } catch {
      /* ignora */
    }
    setPousada(null)
  }, [])

  return { pousada, carregando, entrar, sair, pousadas: POUSADAS }
}
