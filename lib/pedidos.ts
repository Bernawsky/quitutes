export const HORARIOS = ["6:30hrs", "8hrs"] as const
export type Horario = (typeof HORARIOS)[number]

export const ITENS = [
  { key: "cafe", label: "Garrafinha de café" },
  { key: "suco", label: "Garrafinha de suco" },
  { key: "cha", label: "Garrafinha de chá" },
  { key: "aguaQuente", label: "Garrafinha de água quente" },
  { key: "ovos", label: "Ovos mexidos" },
] as const
export type ItemKey = (typeof ITENS)[number]["key"]
export type Itens = Record<string, number>

export const LINK_GRUPO = "https://chat.whatsapp.com/JBiJEQHZATBBhfA3e9ji3p"

// Total de itens (soma das quantidades) para métricas de volume
export function contarItens(itens: Itens): number {
  return Object.values(itens ?? {}).reduce((total, qtd) => total + (qtd || 0), 0)
}

// Descreve os itens preenchidos como texto: ["2x Garrafinha de café", ...]
export function descreverItens(itens: Itens): string[] {
  return ITENS.filter((it) => (itens?.[it.key] ?? 0) > 0).map((it) => `${itens[it.key]}x ${it.label}`)
}

export type UnidadePedido = {
  unidade: string
  horario: string
  pessoas: number
  itens: Itens
}

export type Pedido = {
  id: number
  created_at: string
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
  total_unidades: number
  total_itens: number
  total_pessoas: number
}
