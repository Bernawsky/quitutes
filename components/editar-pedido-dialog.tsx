"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UnidadeCard } from "@/components/unidade-card"
import { useUnidadesPedido } from "@/hooks/use-unidades-pedido"
import { editarPedidoPousada, notificarEvento } from "@/lib/pedidos-api"
import type { Pedido } from "@/lib/pedidos"
import type { Pousada } from "@/lib/pousadas"

export function EditarPedidoDialog({
  pedido,
  pousada,
  onClose,
  onSalvo,
}: {
  pedido: Pedido
  pousada: Pousada
  onClose: () => void
  onSalvo: () => void
}) {
  const [saudacao, setSaudacao] = useState(pedido.saudacao || pedido.titulo || "")
  const [mostrarErros, setMostrarErros] = useState(false)
  const [pending, startTransition] = useTransition()

  const { unidades, handleHorario, handlePessoas, handleItem, handleDieta, handleObservacao, handleLimpar, unidadesAtivas, unidadesInvalidas, payload } =
    useUnidadesPedido(pousada, pedido.unidades)

  const salvar = () => {
    if (unidadesAtivas.length === 0) {
      toast.error("O pedido precisa de ao menos uma cesta")
      return
    }
    if (unidadesInvalidas.length > 0) {
      setMostrarErros(true)
      toast.error("Preencha horário e quantidade de pessoas", {
        description: `Pendente em: ${unidadesInvalidas.map((u) => u.nome).join(", ")}`,
      })
      return
    }

    startTransition(async () => {
      try {
        await editarPedidoPousada({ id: pedido.id, saudacao: saudacao.trim(), unidades: payload })
        onSalvo()
        toast.success("Pedido atualizado", { description: "Registrado no sistema." })
        onClose()
        void notificarEvento("edicao", pedido.id)
      } catch (e) {
        toast.error("Não foi possível salvar", { description: e instanceof Error ? e.message : undefined })
      }
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar pedido #{pedido.id}</DialogTitle>
          <DialogDescription>
            As alterações são validadas e salvas no servidor. Unidades que ainda não estão no
            pedido aparecem vazias — é só preencher pra incluí-las.
          </DialogDescription>
        </DialogHeader>

        <label className="mb-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Saudação / Data</span>
          <input
            type="text"
            value={saudacao}
            onChange={(e) => setSaudacao(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {unidades.map((u) => (
            <UnidadeCard
              key={u.id}
              unidade={u}
              horarios={pousada.horarios}
              mostrarErros={mostrarErros}
              onHorario={handleHorario}
              onPessoas={handlePessoas}
              onItem={handleItem}
              onDieta={handleDieta}
              onObservacao={handleObservacao}
              onLimpar={handleLimpar}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending} className="tap min-h-11">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={pending} className="tap min-h-11 gap-2">
            <Save className="size-4" aria-hidden="true" />
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
