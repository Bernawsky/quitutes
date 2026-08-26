import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"
import { IMAGEM_OG } from "@/lib/metadata"

export const metadata: Metadata = {
  title: "Destino de Noiva — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Destino de Noiva: monte as cestas do chalé e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Destino de Noiva — Pedidos de Café da Manhã",
    description: "Monte as cestas do chalé da Destino de Noiva e envie no grupo do WhatsApp.",
    type: "website",
    images: IMAGEM_OG,
  },
}

export default function DestinoDeNoivaPage() {
  return <PedidosPortal slug="destino-de-noiva" />
}
