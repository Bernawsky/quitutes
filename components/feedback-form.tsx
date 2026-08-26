"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Send, Check, MapPin, DoorOpen, User, Phone, MessageSquareText, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type PousadaOpcao = { id: string; nome: string; unidades: { nome: string }[] }

type Props = {
  jaAvaliado: boolean
} & (
  | { token: string; pousadaNome: string; unidadesFixas: string[] }
  | { token?: undefined; pousadaNome?: undefined; unidadesFixas?: undefined }
)

const CAMPO =
  "w-full rounded-xl border border-input bg-background py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"

function Campo({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  disabled,
  placeholder,
  opcoes,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder: string
  opcoes: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(CAMPO, "appearance-none pl-3 pr-9 disabled:cursor-not-allowed disabled:opacity-50", !value && "text-muted-foreground/60")}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value} className="text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

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
      <div className="pop-in flex flex-col items-center gap-3 py-6 text-center">
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
        <Campo label="Pousada" icon={<MapPin className="size-3.5" aria-hidden="true" />}>
          <p className={cn(CAMPO, "flex items-center bg-muted px-3 text-muted-foreground")}>{pousadaNome}</p>
        </Campo>
      ) : (
        <Campo label="Pousada" icon={<MapPin className="size-3.5" aria-hidden="true" />}>
          <Select
            value={pousadaId}
            onChange={(v) => {
              setPousadaId(v)
              setUnidade("")
            }}
            placeholder="Selecione a pousada"
            opcoes={pousadas.map((p) => ({ value: p.id, label: p.nome }))}
          />
        </Campo>
      )}

      <Campo label="Quarto / Chalé" icon={<DoorOpen className="size-3.5" aria-hidden="true" />}>
        <Select
          value={unidade}
          onChange={setUnidade}
          disabled={!token && !pousadaId}
          placeholder="Selecione o quarto/chalé"
          opcoes={unidadesDisponiveis.map((u) => ({ value: u, label: u }))}
        />
      </Campo>

      <Campo label="Nome" icon={<User className="size-3.5" aria-hidden="true" />}>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value.slice(0, 120))}
          placeholder="Seu nome"
          className={cn(CAMPO, "px-3")}
        />
      </Campo>

      <Campo label="WhatsApp (opcional)" icon={<Phone className="size-3.5" aria-hidden="true" />}>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.slice(0, 30))}
          placeholder="(00) 00000-0000"
          className={cn(CAMPO, "px-3")}
        />
      </Campo>

      <Campo label="Feedback" icon={<MessageSquareText className="size-3.5" aria-hidden="true" />}>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Conte como foi a cesta que você recebeu..."
          rows={4}
          className={cn(CAMPO, "resize-none px-3 py-2.5")}
        />
      </Campo>

      <Button onClick={enviar} disabled={enviando} className="tap mt-1 min-h-11 gap-2">
        <Send className="size-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar feedback"}
      </Button>
    </div>
  )
}
