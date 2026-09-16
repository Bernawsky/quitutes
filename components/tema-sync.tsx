"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getPreferenciasInterface } from "@/lib/preferencias-interface-api"
import { aplicarTema, aplicarTamanhoFonte, lerTemaCache, lerFonteCache } from "@/lib/tema"

/**
 * Reconcilia o tema/tamanho de fonte com o que está salvo no banco pra essa conta — o script
 * inline em app/layout.tsx já aplicou o valor em cache local (localStorage) antes da hidratação,
 * pra não piscar; isso aqui só corrige se o banco tiver algo diferente (ex: primeiro acesso
 * neste navegador, ou mudou a preferência em outro dispositivo).
 */
export function TemaSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let ativo = true
    void getPreferenciasInterface(user.id).then((prefs) => {
      if (!ativo) return
      if (prefs.tema !== lerTemaCache()) aplicarTema(prefs.tema)
      if (prefs.tamanho_fonte !== lerFonteCache()) aplicarTamanhoFonte(prefs.tamanho_fonte)
    })
    return () => {
      ativo = false
    }
  }, [user])

  return null
}
