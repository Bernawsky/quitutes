import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"
import { IMAGEM_OG } from "@/lib/metadata"

export const metadata: Metadata = {
  title: "Villa Manso — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Villa Manso: monte as cestas e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Villa Manso — Pedidos de Café da Manhã",
    description: "Monte as cestas da Villa Manso e envie no grupo do WhatsApp.",
    type: "website",
    images: IMAGEM_OG,
  },
}

export default function VillaMansoPage() {
  return <PedidosPortal slug="villa-manso" />
}
