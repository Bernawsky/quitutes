"use client"

import { useEffect, useMemo, useState } from "react"
import { Send, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type PousadaOpcao = { id: string; nome: string; unidades: { nome: string }[] }

type Props = {
  jaAvaliado: boolean
} & (
  | { token: string; pousadaNome: string; unidadesFixas: string[] }
  | { token?: undefined; pousadaNome?: undefined; unidadesFixas?: undefined }
)

export function FeedbackForm(props: Props) {
  const { jaAvaliado, token, pousadaNome, unidadesFixas } = props
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [comentario, setComentario] = useState("")
  const [pousadaId, setPousadaId] = useState("")
  const [unidade, setUnidade] = useState("")
  const [pousadas, setPousadas] = useState<PousadaOpcao[]>([])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(jaAvaliado)

  useEffect(() => {
    if (token) return
    fetch("/api/feedback/pousadas")
      .then((r) => r.json())
      .then((d) => setPousadas(d?.pousadas ?? []))
      .catch(() => toast.error("Não foi possível carregar as pousadas"))
  }, [token])

  const unidadesDisponiveis = useMemo(() => {
    if (unidadesFixas) return unidadesFixas
    return pousadas.find((p) => p.id === pousadaId)?.unidades.map((u) => u.nome) ?? []
  }, [unidadesFixas, pousadas, pousadaId])

  const enviar = async () => {
    if (!token && !pousadaId) {
      toast.error("Selecione a pousada")
      return
    }
    if (!unidade) {
      toast.error("Selecione o quarto/chalé")
      return
    }
    if (!nome.trim()) {
      toast.error("Informe seu nome")
      return
    }
    if (!comentario.trim()) {
      toast.error("Escreva seu feedback")
      return
    }
    setEnviando(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          pousadaId: token ? undefined : pousadaId,
          unidade,
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          comentario: comentario.trim(),
        }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(dados?.error || "Não foi possível enviar seu feedback.")
      setEnviado(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar seu feedback.")
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <p className="font-heading text-lg font-semibold text-card-foreground">Obrigado pelo feedback!</p>
        <p className="text-sm text-muted-foreground">Sua opinião ajuda a melhorar o café da manhã.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {token ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Pousada</span>
          <p className="rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground">{pousadaNome}</p>
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Pousada</span>
          <select
            value={pousadaId}
            onChange={(e) => {
              setPousadaId(e.target.value)
              setUnidade("")
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">Selecione...</option>
            {pousadas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Quarto / Chalé</span>
        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          disabled={!token && !pousadaId}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        >
          <option value="">Selecione...</option>
          {unidadesDisponiveis.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value.slice(0, 120))}
          placeholder="Seu nome"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">WhatsApp (opcional)</span>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.slice(0, 30))}
          placeholder="(00) 00000-0000"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Feedback</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Conte como foi a cesta que você recebeu..."
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <Button onClick={enviar} disabled={enviando} className="tap min-h-11 gap-2">
        <Send className="size-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar feedback"}
      </Button>
    </div>
  )
}
