import type { Metadata } from "next"
import { ProducaoCalculadora } from "@/components/producao-calculadora"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Planejamento de Produção — Quitutes",
  description: "Divide a produção de pães por dia e calcula os ingredientes da massa base.",
}

// Página aberta de propósito (sem exigirEquipeServer): enquanto o resto do site fica em
// modo manutenção (ver lib/manutencao.ts), /producao é a única rota disponível e não exige
// login nenhum.
export default function ProducaoPage() {
  return <ProducaoCalculadora />
}
