import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { listarAdministradores } from "@/app/actions/administracao"
import { AdministracaoPainel } from "@/components/administracao-painel"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Administração — Quitutes",
  description: "Gerencie pousadas, senhas e administradores.",
}

export default async function AdministracaoPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const administradores = await listarAdministradores().catch(() => [])

  return <AdministracaoPainel administradoresIniciais={administradores} />
}
