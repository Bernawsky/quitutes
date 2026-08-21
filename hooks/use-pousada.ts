"use client"

import { useEffect, useState } from "react"
import { supabase, sessaoAtualRenovada } from "@/lib/supabase/client"
import { getPousadaPorAuthUser } from "@/lib/pousadas-api"
import type { Pousada } from "@/lib/pousadas"

/**
 * Sessão real da pousada: deriva do usuário autenticado no Supabase Auth
 * (cada pousada tem uma conta própria, ver lib/pousadas-api.ts).
 */
export function usePousadaSessao() {
  const [pousada, setPousada] = useState<Pousada | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function resolver(userId: string | undefined) {
      if (!userId) {
        if (ativo) {
          setPousada(null)
          setCarregando(false)
        }
        return
      }
      try {
        const p = await getPousadaPorAuthUser(userId)
        if (ativo) {
          setPousada(p)
          setCarregando(false)
        }
      } catch {
        if (ativo) {
          setPousada(null)
          setCarregando(false)
        }
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCarregando(true)
      void resolver(session?.user?.id)
    })

    void sessaoAtualRenovada().then((sessao) => resolver(sessao?.user?.id))

    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const sair = async () => {
    await supabase.auth.signOut()
    setPousada(null)
  }

  return { pousada, carregando, sair }
}
