import type { Metadata } from "next"
import { exigirAdminServer } from "@/lib/supabase/server"
import { MetricasShell } from "@/components/metricas-shell"
import { IMAGEM_OG } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Métricas de Pedidos — Cestas de Café da Manhã",
  description: "Acompanhe pedidos, unidades atendidas, pessoas no café e itens extras por dia, semana, mês e ano.",
  openGraph: {
    title: "Métricas de Pedidos — Cestas de Café da Manhã",
    description: "Fechamento de pedidos por período com gráficos e ranking por unidade.",
    images: IMAGEM_OG,
  },
}

export default async function MetricasLayout({ children }: { children: React.ReactNode }) {
  await exigirAdminServer()

  return <MetricasShell>{children}</MetricasShell>
}
