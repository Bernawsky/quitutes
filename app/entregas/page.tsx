import type { Metadata } from "next"
import { exigirEntregadorServer } from "@/lib/supabase/server"
import { EntregasApp } from "@/components/entregas-app"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Entregas — Quitutes",
  description: "O que precisa sair para entrega e o que já foi entregue.",
}

export default async function EntregasPage() {
  await exigirEntregadorServer()

  return <EntregasApp />
}
