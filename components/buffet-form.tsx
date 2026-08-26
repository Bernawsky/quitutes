"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { UtensilsCrossed, Users, UserRound, CalendarDays, Printer, Plus, Minus, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendario } from "@/components/calendario"
import { VoucherBuffet } from "@/components/voucher-buffet"
import { getBuffetAtivo } from "@/app/actions/buffet"
import { salvarPedidoBuffet, getPedidosBuffet, notificarEvento } from "@/lib/pedidos-api"
import { hojeISO, rotuloData } from "@/lib/pedidos"
import type { Pousada } from "@/lib/pousadas"

export function BuffetForm({ pousada }: { pousada: Pousada }) {
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const { data: meusVouchers = [] } = useSWR(["buffet-vouchers-mine", pousada.id], () => getPedidosBuffet())
  const datasComPedido = useMemo(
    () => meusVouchers.filter((p) => p.status !== "cancelado").map((p) => p.data_pedido),
    [meusVouchers],
  )
  const [pessoas, setPessoas] = useState(1)
  const [hospede, setHospede] = useState("")
  const [data, setData] = useState(hojeISO())
  const [enviando, setEnviando] = useState(false)
  const [voucherGerado, setVoucherGerado] = useState<{ pessoas: number; hospede: string; data: string } | null>(null)

  useEffect(() => {
    void getBuffetAtivo().then(setAtivo)
  }, [])

  const enviar = async () => {
    if (!hospede.trim()) {
      toast.error("Informe o nome do hóspede")
      return
    }
    setEnviando(true)
    try {
      const pedidoId = await salvarPedidoBuffet({
        pousadaId: pousada.id,
        pousada: pousada.nome,
        pessoas,
        hospede: hospede.trim(),
        dataPedido: data,
      })
      setVoucherGerado({ pessoas, hospede: hospede.trim(), data })
      toast.success("Voucher gerado", { description: "Os administradores já podem ver na aba Buffet." })
      void notificarEvento("buffet_novo", pedidoId)
    } catch (e) {
      toast.error("Não foi possível gerar o voucher", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setEnviando(false)
    }
  }

  const novoVoucher = () => {
    setVoucherGerado(null)
    setHospede("")
    setPessoas(1)
  }

  if (ativo === false) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <UtensilsCrossed className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-card-foreground">Buffet desativado no momento</p>
        <p className="mt-1 text-sm text-muted-foreground">A equipe do Quitutes não está servindo o buffet hoje. Tente novamente mais tarde.</p>
      </div>
    )
  }

  if (voucherGerado) {
    return (
      <div className="flex flex-col items-center gap-5 print:block">
        <VoucherBuffet
          pousadaNome={pousada.nome}
          pousadaSlug={pousada.slug}
          pessoas={voucherGerado.pessoas}
          hospede={voucherGerado.hospede}
          dataISO={voucherGerado.data}
        />
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={novoVoucher} className="tap gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            Novo voucher
          </Button>
          <Button onClick={() => window.print()} className="tap gap-2">
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="size-5 text-primary" aria-hidden="true" />
        <p className="font-heading text-base font-semibold text-card-foreground">Voucher de Buffet</p>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Buffet de café colonial, servido na cafeteria das 7h às 12h em finais de semana e feriados.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          Pessoas
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPessoas((p) => Math.max(1, p - 1))}
            className="tap flex size-9 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted"
            aria-label="Diminuir"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-base font-semibold text-foreground">{pessoas}</span>
          <button
            type="button"
            onClick={() => setPessoas((p) => Math.min(50, p + 1))}
            className="tap flex size-9 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted"
            aria-label="Aumentar"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserRound className="size-3.5" aria-hidden="true" />
          Hóspede
        </span>
        <textarea
          value={hospede}
          onChange={(e) => setHospede(e.target.value.slice(0, 200))}
          rows={2}
          placeholder={pessoas === 2 ? "Ex: Erika + acompanhante" : "Nome de cada hóspede"}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <span className="text-[11px] text-muted-foreground">
          Até 2 pessoas: pode ser &quot;Nome + acompanhante&quot;. De 3 em diante, escreva o nome de todos.
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Data
        </span>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="tap justify-start gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                {rotuloData(data)}
              </Button>
            }
          />
          <PopoverContent className="w-auto">
            <Calendario valor={data} minimo={hojeISO()} onSelecionar={setData} somenteDiasBuffet datasComPedido={datasComPedido} />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={enviar} disabled={enviando} className="tap mt-1 min-h-11 gap-2">
        <UtensilsCrossed className="size-4" aria-hidden="true" />
        {enviando ? "Gerando..." : "Gerar voucher"}
      </Button>
    </div>
  )
}
