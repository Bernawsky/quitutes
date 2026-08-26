import type { Metadata } from "next"
import { exigirAdminServer } from "@/lib/supabase/server"
import { listarAdministradores } from "@/app/actions/administracao"
import { AdministracaoPainel } from "@/components/administracao-painel"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Administração — Quitutes",
  description: "Gerencie pousadas, senhas e administradores.",
}

export default async function AdministracaoPage() {
  await exigirAdminServer()

  const administradores = await listarAdministradores().catch(() => [])

  return <AdministracaoPainel administradoresIniciais={administradores} />
}
