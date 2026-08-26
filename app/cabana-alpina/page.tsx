import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"
import { IMAGEM_OG } from "@/lib/metadata"

export const metadata: Metadata = {
  title: "Cabana Alpina — Pedidos de Café da Manhã",
  description: "Sistema de pedidos da Cabana Alpina: monte as cestas das cabanas e envie no grupo do WhatsApp.",
  openGraph: {
    title: "Cabana Alpina — Pedidos de Café da Manhã",
    description: "Monte as cestas das cabanas da Cabana Alpina e envie no grupo do WhatsApp.",
    type: "website",
    images: IMAGEM_OG,
  },
}

export default function CabanaAlpinaPage() {
  return <PedidosPortal slug="cabana-alpina" />
}
