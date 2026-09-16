import { ChefHat, UtensilsCrossed, Bike, type LucideIcon } from "lucide-react"

/** Contas administrativas (Developer / Enterprise) que acessam o dashboard. */
export const ADMINS = [
  {
    valor: "admin:bernardo",
    nome: "Bernardo Campos",
    papel: "Developer",
    email: "bernardootavio007@gmail.com",
    rota: "/metricas",
  },
  {
    valor: "admin:beth",
    nome: "Quitutes da Beth",
    papel: "Enterprise",
    email: "quitutesdabethibitipoca@gmail.com",
    rota: "/metricas",
  },
] as const

/** Equipe interna sem conta de pousada (cozinha, cafeteria, entregador) — cada uma acessa só a própria tela. */
export const EQUIPE = [
  {
    valor: "equipe:cozinha",
    nome: "Equipe da Cozinha",
    papel: "Cozinha",
    email: "cozinha@equipe.quitutes.internal",
    rota: "/leitor",
    icone: ChefHat as LucideIcon,
  },
  {
    valor: "equipe:cafeteria",
    nome: "Equipe da Cafeteria",
    papel: "Cafeteria",
    email: "cafeteria@equipe.quitutes.internal",
    rota: "/vouchers",
    icone: UtensilsCrossed as LucideIcon,
  },
  {
    valor: "equipe:entregador",
    nome: "Entregador",
    papel: "Entregador",
    email: "entregador@equipe.quitutes.internal",
    rota: "/entregas",
    icone: Bike as LucideIcon,
  },
] as const

/** Dado o e-mail (sintético ou real) de uma sessão autenticada, acha a rota certa se for admin/equipe. */
export function rotaPorEmailDeEquipe(email: string | null | undefined): string | null {
  if (!email) return null
  const admin = ADMINS.find((a) => a.email === email)
  if (admin) return admin.rota
  const equipe = EQUIPE.find((e) => e.email === email)
  return equipe?.rota ?? null
}
