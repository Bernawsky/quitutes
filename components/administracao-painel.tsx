"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, KeyRound, Plus, Mail, ShieldCheck, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPousadas, criarPousada, redefinirSenhaPousada } from "@/lib/pousadas-api"
import { convidarAdmin, type Administrador } from "@/app/actions/administracao"

function slugificar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function AdministracaoPainel({ administradoresIniciais }: { administradoresIniciais: Administrador[] }) {
  const { data: pousadas = [], mutate: recarregarPousadas } = useSWR("pousadas-admin", getPousadas)
  const [administradores, setAdministradores] = useState(administradoresIniciais)

  const [redefinindo, setRedefinindo] = useState<string | null>(null)
  const [novaSenha, setNovaSenha] = useState("")
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const [mostrarNovaPousada, setMostrarNovaPousada] = useState(false)
  const [nome, setNome] = useState("")
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [horarios, setHorarios] = useState("")
  const [unidades, setUnidades] = useState("")
  const [criando, setCriando] = useState(false)

  const [emailConvite, setEmailConvite] = useState("")
  const [convidando, setConvidando] = useState(false)

  const salvarNovaSenha = async (pousadaId: string) => {
    if (!novaSenha.trim() || salvandoSenha) return
    setSalvandoSenha(true)
    try {
      await redefinirSenhaPousada(pousadaId, novaSenha.trim())
      toast.success("Senha atualizada")
      setRedefinindo(null)
      setNovaSenha("")
    } catch (e) {
      toast.error("Não foi possível atualizar a senha", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSalvandoSenha(false)
    }
  }

  const criarNovaPousada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (criando) return
    const listaHorarios = horarios
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
    const listaUnidades = unidades
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean)
      .map((linha) => {
        const isSuite = linha.endsWith("*")
        return { nome: isSuite ? linha.slice(0, -1).trim() : linha, ...(isSuite ? { isSuite: true } : {}) }
      })

    if (!nome.trim() || !usuario.trim() || !senha.trim() || listaHorarios.length === 0 || listaUnidades.length === 0) {
      toast.error("Preencha todos os campos (nome, usuário, senha, horários e ao menos uma unidade)")
      return
    }

    setCriando(true)
    try {
      await criarPousada({
        slug: slugificar(usuario),
        nome: nome.trim(),
        usuario: usuario.trim(),
        senha: senha.trim(),
        subtitulo: "Monte os pedidos e envie no grupo do WhatsApp",
        horarios: listaHorarios,
        unidades: listaUnidades,
      })
      toast.success("Pousada criada")
      setNome("")
      setUsuario("")
      setSenha("")
      setHorarios("")
      setUnidades("")
      setMostrarNovaPousada(false)
      void recarregarPousadas()
    } catch (e) {
      toast.error("Não foi possível criar a pousada", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setCriando(false)
    }
  }

  const enviarConvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailConvite.trim() || convidando) return
    setConvidando(true)
    try {
      await convidarAdmin(emailConvite.trim())
      toast.success("Convite enviado", { description: "A pessoa vai receber um e-mail do Supabase para definir a senha." })
      setEmailConvite("")
      setAdministradores((prev) => [...prev, { id: crypto.randomUUID(), email: emailConvite.trim(), criadoEm: new Date().toISOString() }])
    } catch (e) {
      toast.error("Não foi possível enviar o convite", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setConvidando(false)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Link
            href="/metricas"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar às métricas"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold text-card-foreground">Administração</h1>
            <p className="text-sm text-muted-foreground">Pousadas, senhas e administradores</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-card-foreground">
              <Building2 className="size-4 text-primary" aria-hidden="true" />
              Pousadas
            </h2>
            <Button variant="outline" className="gap-2" onClick={() => setMostrarNovaPousada((v) => !v)}>
              <Plus className="size-4" aria-hidden="true" />
              Nova pousada
            </Button>
          </div>

          {mostrarNovaPousada && (
            <form onSubmit={criarNovaPousada} className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Nome</span>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Usuário (login)</span>
                  <input
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Senha</span>
                  <input
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Horários (separados por vírgula)</span>
                  <input
                    value={horarios}
                    onChange={(e) => setHorarios(e.target.value)}
                    placeholder="Ex: 7:00, 9:00"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Unidades (uma por linha; termine com * para marcar como suíte)
                </span>
                <textarea
                  rows={4}
                  value={unidades}
                  onChange={(e) => setUnidades(e.target.value)}
                  placeholder={"Chalé 1\nChalé 2\nSuíte*"}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <Button type="submit" disabled={criando} className="self-end">
                {criando ? "Criando..." : "Criar pousada"}
              </Button>
            </form>
          )}

          <ul className="flex flex-col gap-2">
            {pousadas.map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Usuário: {p.usuario} • Horários: {p.horarios.join(", ")}
                    </p>
                  </div>
                  {redefinindo === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Nova senha"
                        className="w-32 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />
                      <Button size="sm" disabled={salvandoSenha} onClick={() => salvarNovaSenha(p.id)}>
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRedefinindo(null)
                          setNovaSenha("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRedefinindo(p.id)}>
                      <KeyRound className="size-3.5" aria-hidden="true" />
                      Redefinir senha
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-card-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Administradores
          </h2>

          <ul className="mb-4 flex flex-col gap-2">
            {administradores.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <span className="text-card-foreground">{a.email}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.criadoEm).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={enviarConvite} className="flex flex-wrap gap-2">
            <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="email"
                required
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
              />
            </div>
            <Button type="submit" disabled={convidando} className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {convidando ? "Convidando..." : "Convidar administrador"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  )
}
