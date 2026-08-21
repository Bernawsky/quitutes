"use client"

import { useState } from "react"
import { FileDown, Save, Package } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { exportarPedidosCSV, exportarPedidosPDF, type Ranking } from "@/lib/export-pedidos"
import { fecharPeriodo } from "@/app/actions/metricas"
import type { Pedido } from "@/lib/pedidos"

type Props = {
  aberto: boolean
  onClose: () => void
  pedidos: Pedido[]
  ranking: Ranking[]
  periodo: string
  rotuloPeriodo: string
}

type Acao = "tudo" | "fechar" | "arquivos"

export function ExportarDialog({ aberto, onClose, pedidos, ranking, periodo, rotuloPeriodo }: Props) {
  const [ocupado, setOcupado] = useState<Acao | null>(null)

  const executar = async (acao: Acao) => {
    setOcupado(acao)
    try {
      const baixar = acao !== "fechar"
      if (baixar) {
        exportarPedidosPDF(pedidos, ranking, periodo, rotuloPeriodo, true)
        exportarPedidosCSV(pedidos, ranking, periodo)
        toast.success("PDF e CSV baixados")
      }

      if (acao !== "arquivos") {
        await fecharPeriodo({ periodo, rotuloPeriodo, totalPedidos: pedidos.length, ranking, pedidos })
        toast.success("Período fechado. Relatório com análise enviado por e-mail.")
      }
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na exportação")
    } finally {
      setOcupado(null)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Exportar relatório</DialogTitle>
          <DialogDescription>{pedidos.length} pedido(s) {rotuloPeriodo}. Escolha o que deseja fazer.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button className="justify-start gap-2" disabled={ocupado !== null} onClick={() => executar("tudo")}>
            <Package className="size-4" aria-hidden="true" />
            Baixar PDF e CSV + fechar período
          </Button>
          <Button variant="outline" className="justify-start gap-2" disabled={ocupado !== null} onClick={() => executar("fechar")}>
            <Save className="size-4" aria-hidden="true" />
            Somente fechar o período
          </Button>
          <Button variant="outline" className="justify-start gap-2" disabled={ocupado !== null} onClick={() => executar("arquivos")}>
            <FileDown className="size-4" aria-hidden="true" />
            Somente baixar PDF e CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
