import type { Metadata } from "next"
import { exigirEquipeServer } from "@/lib/supabase/server"
import { ProducaoHistorico } from "@/components/producao-historico"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Histórico de Produção — Quitutes",
  description: "Produções de pães já concluídas, com download de PDF.",
}

export default async function ProducaoHistoricoPage() {
  await exigirEquipeServer()

  return <ProducaoHistorico />
}
