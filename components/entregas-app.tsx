"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Bike, CalendarDays, CheckCircle2, Circle, Clock, Building2 } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendario } from "@/components/calendario"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"
import { useAuth } from "@/hooks/use-auth"
import { getPedidosPorData, getDatasComPedidosCesta, marcarEntregue, notificarEntrega } from "@/lib/pedidos-api"
import { supabase } from "@/lib/supabase/client"
import { rotuloData, amanhaISO, type Pedido } from "@/lib/pedidos"
import { cn } from "@/lib/utils"

function CardPedidoEntrega({ pedido, onAlternar, alternando }: { pedido: Pedido; onAlternar: () => void; alternando: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", pedido.entregue ? "border-emerald-200 bg-emerald-50" : "border-border bg-card")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-sm font-semibold text-card-foreground">{pedido.pousada}</p>
          </div>
          {pedido.entregue && pedido.entregue_em && (
            <p className="mt-0.5 text-xs text-emerald-700">
              Entregue às {new Date(pedido.entregue_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAlternar}
          disabled={alternando}
          className={cn(
            "tap flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
            pedido.entregue
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-input bg-background text-foreground hover:border-primary/50",
          )}
        >
          {pedido.entregue ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
          {alternando ? "Salvando…" : pedido.entregue ? "Entregue" : "Marcar entregue"}
        </button>
      </div>

      <ul className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
        {pedido.unidades.map((u, i) => (
          <li key={i} className="flex flex-col gap-0.5 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <span>{u.unidade}</span>
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Clock className="size-3" aria-hidden="true" />
                {u.horario}
              </span>
            </div>
            {u.observacao && <p className="text-xs text-muted-foreground">{u.observacao}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tela do entregador: o que sair pra entrega em uma data, com toggle de entregue/não entregue por pedido. */
export function EntregasApp() {
  const { user } = useAuth()
  const [data, setData] = useState(amanhaISO())
  const { data: pedidos = [], isLoading, mutate } = useSWR(["entregas-pedidos", data], () => getPedidosPorData(data))
  const { data: datasComPedido = [] } = useSWR("leitor-datas-com-pedido", getDatasComPedidosCesta)
  const [alternando, setAlternando] = useState<number | null>(null)

  useEffect(() => {
    const canal = supabase
      .channel("pedidos-entrega-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => void mutate())
      .subscribe()
    return () => {
      void supabase.removeChannel(canal)
    }
  }, [mutate])

  const paraEntregar = pedidos.filter((p) => !p.entregue)
  const entregues = pedidos.filter((p) => p.entregue)

  async function alternar(pedido: Pedido) {
    if (!user || alternando) return
    setAlternando(pedido.id)
    try {
      await marcarEntregue(pedido.id, !pedido.entregue, user.id)
      await mutate()
      void notificarEntrega(pedido.id)
    } finally {
      setAlternando(null)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bike className="size-5" aria-hidden="true" />
          </span>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Entregas</h1>
            <p className="text-sm text-muted-foreground">O que precisa sair e o que já foi entregue</p>
          </div>
          <AvisosBell />
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="tap gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {rotuloData(data)}
                </Button>
              }
            />
            <PopoverContent className="w-auto">
              <Calendario valor={data} onSelecionar={setData} datasComPedido={datasComPedido} />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <AvisoPushDesativado />

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : pedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Bike className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhum pedido nesse dia</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Para entregar ({paraEntregar.length})
              </h2>
              <div className="flex flex-col gap-3">
                {paraEntregar.length === 0 && <p className="text-sm text-muted-foreground">Tudo entregue por aqui.</p>}
                {paraEntregar.map((p) => (
                  <CardPedidoEntrega key={p.id} pedido={p} onAlternar={() => void alternar(p)} alternando={alternando === p.id} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Entregues ({entregues.length})
              </h2>
              <div className="flex flex-col gap-3">
                {entregues.length === 0 && <p className="text-sm text-muted-foreground">Nada entregue ainda.</p>}
                {entregues.map((p) => (
                  <CardPedidoEntrega key={p.id} pedido={p} onAlternar={() => void alternar(p)} alternando={alternando === p.id} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
