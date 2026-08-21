"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Ban, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copiarTexto } from "@/components/reservas-app"
import { cancelarPedidoPousada } from "@/lib/pedidos-api"
import { LINK_GRUPO, gerarMensagemCancelamento, type Pedido } from "@/lib/pedidos"

export function CancelarPedidoDialog({
  pedido,
  onClose,
  onCancelado,
}: {
  pedido: Pedido
  onClose: () => void
  onCancelado: () => void
}) {
  const [motivo, setMotivo] = useState("")
  const [pending, startTransition] = useTransition()

  const confirmar = () => {
    copiarTexto(gerarMensagemCancelamento(pedido, motivo.trim()))
    startTransition(async () => {
      try {
        await cancelarPedidoPousada({ id: pedido.id, motivo: motivo.trim() })
        onCancelado()
        // Avisa os admins por WhatsApp (best-effort: não bloqueia o fluxo se falhar).
        void fetch("/api/notificar/cancelamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: pedido.id, pousada: pedido.pousada, motivo: motivo.trim() }),
        }).catch(() => {})
        toast.success("Pedido cancelado", { description: "Mensagem copiada. Abrindo o grupo do WhatsApp." })
        onClose()
        window.setTimeout(() => {
          const aba = window.open(LINK_GRUPO, "_blank", "noopener,noreferrer")
          if (!aba) window.location.href = LINK_GRUPO
        }, 1200)
      } catch (e) {
        toast.error("Não foi possível cancelar", { description: e instanceof Error ? e.message : undefined })
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Cancelar pedido #{pedido.id}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {(pedido.unidades?.length ?? 0) === 1
            ? "Esta é a única cesta do pedido. Ao confirmar, uma mensagem curta de cancelamento será copiada e o grupo do WhatsApp será aberto."
            : "Todas as cestas deste pedido serão canceladas e uma mensagem será copiada para o grupo."}
        </p>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Motivo (opcional)</span>
          <textarea
            rows={2}
            maxLength={280}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: hóspede desistiu do café"
            className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={pending} className="gap-2">
            <Ban className="size-4" aria-hidden="true" />
            {pending ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </div>
      </div>
    </div>
  )
}
