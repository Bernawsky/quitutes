import type { Metadata } from "next"
import { PedidosPortal } from "@/components/pedidos-portal"
import { IMAGEM_OG } from "@/lib/metadata"

export const metadata: Metadata = {
  title: "Pedidos de Café da Manhã — Pousadas Quitutes",
  description: "Entre com o usuário da pousada, monte os pedidos das cestas de café da manhã e envie rapidamente no grupo do WhatsApp.",
  openGraph: {
    title: "Pedidos de Café da Manhã — Pousadas Quitutes",
    description: "Login por pousada para montar e enviar os pedidos das cestas de café da manhã.",
    type: "website",
    images: IMAGEM_OG,
  },
}

export default function Page() {
  return <PedidosPortal />
}
