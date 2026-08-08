export const HORARIOS = ["6:30hrs", "8hrs"] as const
export type Horario = (typeof HORARIOS)[number]

export const OBSERVACOES = [
  "+1 Garrafinha de café",
  "+2 Garrafinhas de café",
  "+1 Garrafinha de suco",
  "+2 Garrafinhas de suco",
  "+1 Garrafinha de água quente",
  "+2 Garrafinhas de água quente",
  "1 Ovo mexido",
  "2 Ovos mexidos",
  "3 Ovos mexidos",
] as const
export type Observacao = (typeof OBSERVACOES)[number]

export const LINK_GRUPO = "https://chat.whatsapp.com/JBiJEQHZATBBhfA3e9ji3p"

// Quantos itens cada observação representa (para métricas de volume)
export function contarItens(observacoes: string[]): number {
  return observacoes.reduce((total, obs) => {
    const match = obs.match(/(\d+)/)
    return total + (match ? Number.parseInt(match[1], 10) : 1)
  }, 0)
}

export type UnidadePedido = {
  unidade: string
  horario: string
  observacoes: string[]
}

export type Pedido = {
  id: number
  created_at: string
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
  total_unidades: number
  total_itens: number
}
