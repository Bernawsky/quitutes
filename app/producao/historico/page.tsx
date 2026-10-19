import type { Metadata } from "next"
import { ProducaoHistorico } from "@/components/producao-historico"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Histórico de Produção — Quitutes",
  description: "Produções de pães já concluídas, com download de PDF.",
}

// Sem exigirEquipeServer de propósito — ver app/producao/page.tsx.
export default function ProducaoHistoricoPage() {
  return <ProducaoHistorico />
}
