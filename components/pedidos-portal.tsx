"use client"

import { useEffect, useState } from "react"
import { usePousadaSessao } from "@/hooks/use-pousada"
import { PousadaLogin } from "@/components/pousada-login"
import { ReservasApp } from "@/components/reservas-app"
import { getPousadaPorSlug } from "@/lib/pousadas-api"
import { supabase } from "@/lib/supabase/client"
import type { Pousada } from "@/lib/pousadas"

/** Portal de pedidos: exige login da pousada (Supabase Auth) e reage à sessão automaticamente. */
export function PedidosPortal({ slug }: { slug?: string }) {
  const { pousada, carregando, sair } = usePousadaSessao()
  const [pousadaFixa, setPousadaFixa] = useState<Pousada | null | undefined>(slug ? undefined : null)

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

  if (carregando || pousadaFixa === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  // URL fixa de uma pousada: se a sessão atual é de outra pousada, desloga.
  if (pousada && pousadaFixa && pousada.slug !== pousadaFixa.slug) {
    void supabase.auth.signOut()
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    )
  }

  const ativa = pousadaFixa ? (pousada?.slug === pousadaFixa.slug ? pousada : null) : pousada

  if (!ativa) {
    return <PousadaLogin {...(pousadaFixa ? { pousadaFixa } : {})} />
  }

  return <ReservasApp pousada={ativa} onSair={sair} />
}
