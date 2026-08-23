"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UnidadeCard, type Unidade } from "@/components/unidade-card"
import { copiarTexto } from "@/components/reservas-app"
import { editarPedidoPousada } from "@/lib/pedidos-api"
import { LINK_GRUPO, gerarMensagemEdicao, normalizarHorario, type Pedido, type UnidadePedido } from "@/lib/pedidos"
import type { Pousada } from "@/lib/pousadas"

function paraUnidades(pedido: Pedido): Unidade[] {
  return (pedido.unidades ?? []).map((u, i) => ({
    id: i + 1,
    nome: u.unidade,
    isSuite: u.unidade.toLowerCase().includes("suíte"),
    horario: normalizarHorario(u.horario),
    pessoas: u.pessoas,
    itens: u.itens ?? {},
    dietas: u.dietas ?? [],
    observacao: u.observacao ?? "",
  }))
}

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
  const [unidades, setUnidades] = useState<Unidade[]>(() => paraUnidades(pedido))
  const [mostrarErros, setMostrarErros] = useState(false)
  const [pending, startTransition] = useTransition()

  const horarios = pousada.horarios

  const invalidas = unidades.filter((u) => !u.horario || !(u.pessoas > 0))

  const atualizar = (id: number, patch: Partial<Unidade>) =>
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))

  const salvar = () => {
    if (unidades.length === 0) {
      toast.error("O pedido precisa de ao menos uma cesta")
      return
    }
    if (invalidas.length > 0) {
      setMostrarErros(true)
      toast.error("Preencha horário e quantidade de pessoas", {
        description: `Pendente em: ${invalidas.map((u) => u.nome).join(", ")}`,
      })
      return
    }

    const payload: UnidadePedido[] = unidades.map((u) => ({
      unidade: u.nome,
      horario: u.horario,
      pessoas: u.pessoas,
      itens: u.itens,
      dietas: u.dietas ?? [],
      observacao: u.observacao?.trim() ?? "",
    }))

    // Copia dentro do gesto do usuário
    copiarTexto(gerarMensagemEdicao(saudacao.trim(), payload))

    startTransition(async () => {
      try {
        await editarPedidoPousada({ id: pedido.id, saudacao: saudacao.trim(), unidades: payload })
        onSalvo()
        toast.success("Pedido atualizado", { description: "Mensagem copiada. Abrindo o grupo do WhatsApp." })
        onClose()
        window.setTimeout(() => {
          const aba = window.open(LINK_GRUPO, "_blank", "noopener,noreferrer")
          if (!aba) window.location.href = LINK_GRUPO
        }, 1200)
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
          <DialogDescription>As alterações são validadas no servidor e a mensagem atualizada é enviada ao grupo.</DialogDescription>
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
              horarios={horarios}
              mostrarErros={mostrarErros}
              onHorario={(id, horario) => atualizar(id, { horario })}
              onPessoas={(id, pessoas) => atualizar(id, { pessoas })}
              onItem={(id, key, qtd) =>
                setUnidades((prev) =>
                  prev.map((it) => {
                    if (it.id !== id) return it
                    const itens = { ...it.itens }
                    if (qtd > 0) itens[key] = qtd
                    else delete itens[key]
                    return { ...it, itens }
                  }),
                )
              }
              onDieta={(id, key, ativo) =>
                setUnidades((prev) =>
                  prev.map((it) =>
                    it.id === id
                      ? {
                          ...it,
                          dietas: ativo ? Array.from(new Set([...(it.dietas ?? []), key])) : (it.dietas ?? []).filter((d) => d !== key),
                        }
                      : it,
                  ),
                )
              }
              onObservacao={(id, texto) => atualizar(id, { observacao: texto })}
              onLimpar={(id) => setUnidades((prev) => prev.filter((it) => it.id !== id))}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending} className="tap min-h-11">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={pending} className="tap min-h-11 gap-2">
            <Save className="size-4" aria-hidden="true" />
            {pending ? "Salvando..." : "Salvar e enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
