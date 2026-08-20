"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogIn, Lock, Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) {
      toast.error("Não foi possível entrar", { description: "Verifique o e-mail e a senha." })
      return
    }
    toast.success("Bem-vindo de volta!")
    router.push("/metricas")
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar aos pedidos
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-xl font-bold text-card-foreground">Área restrita</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com sua conta autorizada para acessar as métricas e administrar pedidos.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={entrar}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">E-mail</span>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
                  placeholder="voce@email.com"
                />
              </div>
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
                  className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <Button type="submit" disabled={enviando} className="gap-2">
              <LogIn className="size-4" aria-hidden="true" />
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">O acesso é liberado apenas para contas autorizadas pela administração.</p>
        </div>
      </div>
    </div>
  )
}
