"use client"

import useSWR from "swr"
import { MessageSquareHeart, Phone } from "lucide-react"
import { getFeedbacks } from "@/lib/pedidos-api"
import { rotuloData, type Feedback } from "@/lib/pedidos"

export function FeedbacksLista({ mostrarPousada = false }: { mostrarPousada?: boolean }) {
  const { data: feedbacks = [], isLoading } = useSWR<Feedback[]>("feedbacks", getFeedbacks)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando feedbacks...</p>
  }

  if (feedbacks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <MessageSquareHeart className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum feedback recebido ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie o link de avaliação em &quot;Meus pedidos&quot; para os hóspedes darem sua opinião.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {feedbacks.map((f) => {
        const nomePousada = f.pousada?.nome ?? f.pedido?.pousada
        return (
        <li key={f.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-card-foreground">{f.nome}</p>
              <p className="text-xs text-muted-foreground">
                {mostrarPousada && nomePousada ? `${nomePousada} • ` : ""}
                {f.unidade ? `${f.unidade} • ` : ""}
                {f.pedido?.data_pedido ? `Café de ${rotuloData(f.pedido.data_pedido)} • ` : ""}
                {new Date(f.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {f.whatsapp && (
              <a
                href={`https://wa.me/${f.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                <Phone className="size-3" aria-hidden="true" />
                {f.whatsapp}
              </a>
            )}
          </div>
          {f.comentario && <p className="mt-2 text-sm text-foreground">{f.comentario}</p>}
        </li>
        )
      })}
    </ul>
  )
}
