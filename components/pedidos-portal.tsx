"use client"

import { useEffect, useState } from "react"
import { usePousadaSessao } from "@/hooks/use-pousada"
import { useSplashDiario } from "@/hooks/use-splash-diario"
import { PousadaLogin } from "@/components/pousada-login"
import { ReservasApp } from "@/components/reservas-app"
import { TelaCarregando } from "@/components/tela-carregando"
import { SplashBranding } from "@/components/splash-branding"
import { getPousadaPorSlug } from "@/lib/pousadas-api"
import { supabase } from "@/lib/supabase/client"
import type { Pousada } from "@/lib/pousadas"

/** Portal de pedidos: exige login da pousada (Supabase Auth) e reage à sessão automaticamente. */
export function PedidosPortal({ slug }: { slug?: string }) {
  const { pousada, carregando, sair } = usePousadaSessao()
  const [pousadaFixa, setPousadaFixa] = useState<Pousada | null | undefined>(slug ? undefined : null)
  const { mostrarSplash, splashVerificado, concluirSplash } = useSplashDiario()

  useEffect(() => {
    if (!slug) return
    let ativo = true
    void getPousadaPorSlug(slug).then((p) => {
      if (ativo) setPousadaFixa(p)
    })
    return () => {
      ativo = false
    }
  }, [slug])

  // Primeira abertura do dia: toca o vídeo inteiro uma vez, como afirmação de marca.
  if (!splashVerificado) {
    return <TelaCarregando />
  }
  if (mostrarSplash) {
    return <SplashBranding onConcluir={concluirSplash} />
  }

  if (carregando || pousadaFixa === undefined) {
    return <TelaCarregando />
  }

  // URL fixa de uma pousada: se a sessão atual é de outra pousada, desloga.
  if (pousada && pousadaFixa && pousada.slug !== pousadaFixa.slug) {
    void supabase.auth.signOut()
    return <TelaCarregando texto="Redirecionando..." />
  }

  const ativa = pousadaFixa ? (pousada?.slug === pousadaFixa.slug ? pousada : null) : pousada

  if (!ativa) {
    return <PousadaLogin {...(pousadaFixa ? { pousadaFixa } : {})} />
  }

  return <ReservasApp pousada={ativa} onSair={sair} />
}
