"use client"

import { usePousada } from "@/hooks/use-pousada"
import { PousadaLogin } from "@/components/pousada-login"
import { ReservasApp } from "@/components/reservas-app"
import { pousadaPorSlug } from "@/lib/pousadas"

/** Portal de pedidos: exige login da pousada e mantém a sessão salva no navegador. */
export function PedidosPortal({ slug }: { slug?: string }) {
  const { pousada, carregando, entrar, sair } = usePousada()
  const fixa = slug ? pousadaPorSlug(slug) : null
  const ativa = fixa ? (pousada?.slug === fixa.slug ? pousada : null) : pousada

  if (carregando) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!ativa) {
    return <PousadaLogin onEntrar={entrar} {...(fixa ? { pousadaFixa: fixa } : {})} />
  }

  return <ReservasApp pousada={ativa} onSair={sair} />
}
