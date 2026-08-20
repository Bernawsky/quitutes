import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"

export const metadata: Metadata = {
  title: "Pousada Ser.Tão — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Pousada Ser.Tão: monte as cestas dos quartos e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Pousada Ser.Tão — Pedidos de Café da Manhã",
    description: "Monte as cestas dos quartos da Ser.Tão e envie no grupo do WhatsApp.",
    type: "website",
  },
}

export default function SerTaoPage() {
  return <PedidosPortal slug="ser-tao" />
}
