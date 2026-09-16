"use client"

import { useEffect, useState } from "react"
import { encerrarSessao, supabase, sessaoAtualRenovada } from "@/lib/supabase/client"
import { getPousadaPorAuthUser } from "@/lib/pousadas-api"
import type { Pousada } from "@/lib/pousadas"

/**
 * Sessão real da pousada: deriva do usuário autenticado no Supabase Auth
 * (cada pousada tem uma conta própria, ver lib/pousadas-api.ts).
 */
export function usePousadaSessao() {
  const [pousada, setPousada] = useState<Pousada | null>(null)
  // E-mail da sessão autenticada, mesmo quando não é uma pousada (admin/equipe) — usado pelo
  // PedidosPortal pra saber que existe sessão válida e redirecionar em vez de mostrar o login.
  const [emailSessao, setEmailSessao] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function resolver(userId: string | undefined, email: string | null | undefined) {
      if (ativo) setEmailSessao(email ?? null)
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
      void resolver(session?.user?.id, session?.user?.email)
    })

    void sessaoAtualRenovada().then((sessao) => resolver(sessao?.user?.id, sessao?.user?.email))

    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const sair = async () => {
    await encerrarSessao()
    setPousada(null)
    setEmailSessao(null)
  }

  return { pousada, emailSessao, carregando, sair }
}
