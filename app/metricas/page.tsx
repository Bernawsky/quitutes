import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { MetricasDashboard } from "@/components/metricas-dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Métricas de Pedidos — Cestas de Café da Manhã",
  description: "Acompanhe pedidos, unidades atendidas, pessoas no café e itens extras por dia, semana, mês e ano.",
  openGraph: {
    title: "Métricas de Pedidos — Cestas de Café da Manhã",
    description: "Fechamento de pedidos por período com gráficos e ranking por unidade.",
  },
}

export default async function MetricasPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  return <MetricasDashboard />
}
