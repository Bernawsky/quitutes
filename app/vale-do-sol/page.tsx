import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"

export const metadata: Metadata = {
  title: "Vale do Sol — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Pousada Vale do Sol: monte as cestas dos chalés e da suíte e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Vale do Sol — Pedidos de Café da Manhã",
    description: "Monte as cestas dos chalés do Vale do Sol e envie no grupo do WhatsApp.",
    type: "website",
  },
}

export default function ValeDoSolPage() {
  return <PedidosPortal slug="vale-do-sol" />
}
