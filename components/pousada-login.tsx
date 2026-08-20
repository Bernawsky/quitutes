"use client"

import { useState } from "react"
import { LogIn, Lock, ShieldCheck, Building2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { autenticarPousada, POUSADAS, type Pousada } from "@/lib/pousadas"

type Props = {
  onEntrar: (pousada: Pousada) => void
  /** Quando definido, só aceita o login desta pousada. */
  pousadaFixa?: Pousada
}

/** Contas administrativas (Developer / Enterprise) que acessam o dashboard. */
const ADMINS = [
  {
    valor: "admin:bernardo",
    nome: "Bernardo Campos",
    papel: "Developer",
    email: "bernardootavio007@gmail.com",
  },
  {
    valor: "admin:beth",
    nome: "Quitutes da Beth",
    papel: "Enterprise",
    email: "quitutesdabethibitipoca@gmail.com",
  },
] as const

export function PousadaLogin({ onEntrar, pousadaFixa }: Props) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState(pousadaFixa?.slug ?? "")
  const [senha, setSenha] = useState("")
  const [enviando, setEnviando] = useState(false)

  const admin = ADMINS.find((a) => a.valor === selecionado)

  const rotulos: Record<string, string> = {
    ...Object.fromEntries(POUSADAS.map((p) => [p.slug, p.nome])),
    ...Object.fromEntries(ADMINS.map((a) => [a.valor, a.nome])),
  }

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return

    if (admin) {
      setEnviando(true)
      const { error } = await supabase.auth.signInWithPassword({ email: admin.email, password: senha })
      setEnviando(false)
      if (error) {
        toast.error("Senha inválida para a conta administrativa")
        return
      }
      toast.success(`Bem-vindo, ${admin.nome}!`)
      router.push("/metricas")
      return
    }

    const alvo = POUSADAS.find((p) => p.slug === selecionado)
    const p = alvo ? autenticarPousada(alvo.usuario, senha) : null
    if (p && (!pousadaFixa || p.slug === pousadaFixa.slug)) {
      toast.success(`Bem-vindo, ${p.nome}!`)
      onEntrar(p)
      return
    }

    toast.error("Usuário ou senha inválidos")
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-xl font-bold text-card-foreground">{pousadaFixa ? pousadaFixa.nome : "Sistema de Pedidos"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha sua pousada e informe a senha para montar os pedidos. Contas de administração acessam o dashboard de métricas.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={submeter}>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Usuário</span>
            <Select value={selecionado} onValueChange={(v) => setSelecionado(v ?? "")} disabled={Boolean(pousadaFixa)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background text-sm">
                <SelectValue placeholder="Escolha sua pousada">
                  {(valor: string | null) => (valor ? (rotulos[valor] ?? valor) : "Escolha sua pousada")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Pousadas</SelectLabel>
                  {POUSADAS.map((p) => (
                    <SelectItem key={p.slug} value={p.slug} className="rounded-lg py-2.5">
                      <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium">{p.usuario}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Administration</SelectLabel>
                  {ADMINS.map((a) => (
                    <SelectItem key={a.valor} value={a.valor} className="rounded-lg py-2.5">
                      <ShieldCheck className="size-4 text-accent-foreground" aria-hidden="true" />
                      <span className="font-medium">{a.nome}</span>
                      <span className="ml-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                        {a.papel}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Senha</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none"
                placeholder="••••"
              />
            </div>
          </label>

          <Button type="submit" disabled={enviando || !selecionado} className="gap-2">
            <LogIn className="size-4" aria-hidden="true" />
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">Pousadas cadastradas e contas administrativas autorizadas.</p>
      </div>
    </div>
  )
}
