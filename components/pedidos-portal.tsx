"use client"

import { useCallback, useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { usePousadaSessao } from "@/hooks/use-pousada"
import { useSplashDiario } from "@/hooks/use-splash-diario"
import { PousadaLogin } from "@/components/pousada-login"
import { ReservasApp } from "@/components/reservas-app"
import { TelaCarregando } from "@/components/tela-carregando"
import { SplashBranding } from "@/components/splash-branding"
import { Button } from "@/components/ui/button"
import { getPousadaPorSlug } from "@/lib/pousadas-api"
import { supabase } from "@/lib/supabase/client"
import type { Pousada } from "@/lib/pousadas"

/** Portal de pedidos: exige login da pousada (Supabase Auth) e reage à sessão automaticamente. */
export function PedidosPortal({ slug }: { slug?: string }) {
  const { pousada, carregando, sair } = usePousadaSessao()
  const [pousadaFixa, setPousadaFixa] = useState<Pousada | null | undefined>(slug ? undefined : null)
  const [erroConexao, setErroConexao] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const { mostrarSplash, splashVerificado, concluirSplash } = useSplashDiario()

  useEffect(() => {
    if (!slug) return
    let ativo = true
    setErroConexao(false)

    // Timeout defensivo: numa rede móvel instável a chamada pode nunca resolver
    // nem rejeitar — sem isso, a tela ficaria presa em "Carregando..." para sempre.
    const comTimeout = Promise.race([
      getPousadaPorSlug(slug),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("tempo esgotado")), 10_000)),
    ])

    comTimeout
      .then((p) => {
        if (ativo) setPousadaFixa(p)
      })
      .catch(() => {
        if (ativo) setErroConexao(true)
      })
    return () => {
      ativo = false
    }
  }, [slug, tentativa])

  const tentarNovamente = useCallback(() => setTentativa((t) => t + 1), [])

  // Primeira abertura do dia: toca o vídeo inteiro uma vez, como afirmação de marca.
  if (!splashVerificado) {
    return <TelaCarregando />
  }
  if (mostrarSplash) {
    return <SplashBranding onConcluir={concluirSplash} />
  }

  if (erroConexao) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <WifiOff className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-semibold text-foreground">Sem conexão</p>
          <p className="text-sm text-muted-foreground">Não foi possível carregar a pousada. Confira sua internet e tente de novo.</p>
        </div>
        <Button onClick={tentarNovamente} className="tap min-h-11">
          Tentar novamente
        </Button>
      </div>
    )
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
