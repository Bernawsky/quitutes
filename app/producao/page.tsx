import type { Metadata } from "next"
import { exigirAdminServer } from "@/lib/supabase/server"
import { ProducaoCalculadora } from "@/components/producao-calculadora"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Planejamento de Produção — Quitutes",
  description: "Divide a produção de pães por dia e calcula os ingredientes da massa base.",
}

export default async function ProducaoPage() {
  await exigirAdminServer()

  return <ProducaoCalculadora />
}
