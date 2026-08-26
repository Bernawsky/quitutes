import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"
import { IMAGEM_OG } from "@/lib/metadata"

export const metadata: Metadata = {
  title: "Pousada Itaoka Belvedere — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Pousada Itaoka Belvedere: monte as cestas dos chalés e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Pousada Itaoka Belvedere — Pedidos de Café da Manhã",
    description: "Monte as cestas dos chalés da Itaoka Belvedere e envie no grupo do WhatsApp.",
    type: "website",
    images: IMAGEM_OG,
  },
}

export default function ItaokaBelvederePage() {
  return <PedidosPortal slug="itaoka-belvedere" />
}
