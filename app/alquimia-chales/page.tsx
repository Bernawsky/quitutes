import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"

export const metadata: Metadata = {
  title: "Alquimia Chalés — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Alquimia Chalés: monte as cestas dos chalés e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Alquimia Chalés — Pedidos de Café da Manhã",
    description: "Monte as cestas dos chalés da Alquimia e envie no grupo do WhatsApp.",
    type: "website",
  },
}

export default function AlquimiaChalesPage() {
  return <PedidosPortal slug="alquimia-chales" />
}
