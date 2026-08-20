import type { Metadata } from "next"
import { AuthForm } from "@/app/auth/auth-form"

export const metadata: Metadata = {
  title: "Entrar — Painel de Pedidos Quitutes",
  description: "Área restrita: entre com sua conta autorizada para acessar as métricas e administrar os pedidos das cestas de café da manhã.",
  openGraph: {
    title: "Entrar — Painel de Pedidos Quitutes",
    description: "Acesso restrito ao painel de métricas e administração de pedidos.",
  },
}

export default function AuthPage() {
  return <AuthForm />
}
