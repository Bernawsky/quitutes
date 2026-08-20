"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UnidadeCard, type Unidade } from "@/components/unidade-card"
import { copiarTexto } from "@/components/reservas-app"
import { editarPedido } from "@/app/actions/pedidos-admin"
import { LINK_GRUPO, gerarMensagemEdicao, normalizarHorario, type Pedido, type UnidadePedido } from "@/lib/pedidos"

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
  onClose,
  onSalvo,
}: {
  pedido: Pedido
  onClose: () => void
  onSalvo: () => void
}) {
  const [saudacao, setSaudacao] = useState(pedido.saudacao || pedido.titulo || "")
  const [unidades, setUnidades] = useState<Unidade[]>(() => paraUnidades(pedido))
  const [mostrarErros, setMostrarErros] = useState(false)
  const [pending, startTransition] = useTransition()

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
        await editarPedido({ id: pedido.id, saudacao: saudacao.trim(), unidades: payload })
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Editar pedido #{pedido.id}</h2>
            <p className="text-sm text-muted-foreground">
              As alterações são validadas no servidor e a mensagem atualizada é enviada ao grupo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar edição"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

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

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={pending} className="gap-2">
            <Save className="size-4" aria-hidden="true" />
            {pending ? "Salvando..." : "Salvar e enviar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
