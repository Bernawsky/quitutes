"use client"

import { useEffect, useId, useState } from "react"
import useSWR, { mutate as mutateGlobal } from "swr"
import { Bell, BellOff, BellRing, Ban, ShoppingBasket, Pencil, UtensilsCrossed, Trash2, Truck } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useAuth } from "@/hooks/use-auth"
import { getLimpoAteId, limparNotificacoes } from "@/lib/notificacoes-api"

type Evento = {
  id: number
  tipo: "novo_pedido" | "edicao" | "cancelamento" | "buffet_novo" | "entrega"
  mensagem: string
  criado_em: string
}

const ICONES: Record<Evento["tipo"], typeof ShoppingBasket> = {
  novo_pedido: ShoppingBasket,
  edicao: Pencil,
  cancelamento: Ban,
  buffet_novo: UtensilsCrossed,
  entrega: Truck,
}

async function getEventos(): Promise<Evento[]> {
  const { data, error } = await supabase.from("eventos").select("id, tipo, mensagem, criado_em").order("criado_em", { ascending: false }).limit(30)
  if (error) throw error
  return (data ?? []) as Evento[]
}

/** Sino de avisos (novo pedido, edição, cancelamento, voucher de buffet) + controle de notificações push. */
export function AvisosBell() {
  const { user } = useAuth()
  const { data: todosEventos = [] } = useSWR("eventos", getEventos)
  const { data: limpoAteId = 0, mutate: mutateLimpo } = useSWR(user ? ["notificacoes-limpas", user.id] : null, () => getLimpoAteId(user!.id))
  const { estado, carregando, ativar, desativar } = usePushNotifications()
  const [limpando, setLimpando] = useState(false)
  // O layout de métricas monta o sino tanto no cabeçalho mobile quanto na barra de desktop
  // (só um dos dois fica visível por vez via CSS) — precisa de um canal por instância, senão
  // o segundo .subscribe() na mesma tabela colide com "tried to subscribe multiple times".
  const idInstancia = useId()

  useEffect(() => {
    const canal = supabase
      .channel(`eventos-realtime-${idInstancia}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "eventos" }, () => void mutateGlobal("eventos"))
      .subscribe()
    return () => {
      void supabase.removeChannel(canal)
    }
  }, [idInstancia])

  const eventos = todosEventos.filter((e) => e.id > limpoAteId)

  const limpar = async () => {
    if (!user || eventos.length === 0) return
    setLimpando(true)
    try {
      const maiorId = todosEventos[0].id
      await limparNotificacoes(user.id, maiorId)
      await mutateLimpo(maiorId)
    } finally {
      setLimpando(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Avisos"
            className="tap relative flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell className="size-4" aria-hidden="true" />
            {eventos.length > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {eventos.length > 9 ? "9+" : eventos.length}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-card-foreground">Avisos</p>
          <div className="flex items-center gap-1">
            {eventos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="tap h-7 gap-1.5 px-2 text-xs"
                disabled={limpando}
                onClick={() => void limpar()}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Limpar
              </Button>
            )}
            {estado !== "indisponivel" && (
              <Button
                variant="ghost"
                size="sm"
                className="tap h-7 gap-1.5 px-2 text-xs"
                disabled={carregando || estado === "negado"}
                onClick={() => void (estado === "ativo" ? desativar() : ativar())}
              >
                {estado === "ativo" ? (
                  <BellRing className="size-3.5" aria-hidden="true" />
                ) : (
                  <BellOff className="size-3.5" aria-hidden="true" />
                )}
                {estado === "ativo" ? "Ativas" : estado === "negado" ? "Bloqueadas" : "Ativar"}
              </Button>
            )}
          </div>
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {eventos.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {todosEventos.length === 0 ? "Nenhum aviso ainda." : "Tudo limpo por aqui."}
            </li>
          ) : (
            eventos.map((e) => {
              const Icone = ICONES[e.tipo]
              return (
                <li key={e.id} className="flex items-start gap-2.5 border-b border-border/60 px-3 py-2.5 last:border-0">
                  <Icone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm text-card-foreground">{e.mensagem}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.criado_em).toLocaleString("pt-BR")}</p>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
