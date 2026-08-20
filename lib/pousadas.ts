export type Pousada = {
  id: string
  nome: string
  horarioPadrao: string
  horarioFixo: boolean
}

// Horários e ordem definidos na estrutura de entrega (mapa mental "Estrutura de entrega de cestas").
export const POUSADAS: Pousada[] = [
  { id: "vale-do-sol", nome: "Vale Do Sol", horarioPadrao: "6:30", horarioFixo: true },
  { id: "villa-manso", nome: "Villa Manso", horarioPadrao: "7:00", horarioFixo: true },
  { id: "ser-tao", nome: "Ser.Tão", horarioPadrao: "7:30", horarioFixo: true },
  { id: "alquimia", nome: "Alquimia", horarioPadrao: "8:00", horarioFixo: true },
  { id: "itaoka-b", nome: "Itaoka B.", horarioPadrao: "8:30", horarioFixo: true },
  { id: "d-de-noiva", nome: "D. de Noiva", horarioPadrao: "9:00", horarioFixo: false },
  { id: "cabana", nome: "Cabana", horarioPadrao: "9:00", horarioFixo: false },
  { id: "p-bom-tempo", nome: "P. Bom Tempo", horarioPadrao: "9:00", horarioFixo: false },
  { id: "vila-doideira", nome: "Vila Doideira", horarioPadrao: "9:00", horarioFixo: false },
]

export const HORARIOS_DISPONIVEIS = ["6:30", "7:00", "7:30", "8:00", "8:30", "9:00"] as const

export function pousadaPorId(id: string): Pousada | undefined {
  return POUSADAS.find((p) => p.id === id)
}

// Prazo: pedidos devem ser enviados até 16h do dia anterior à entrega.
export const HORA_LIMITE_PEDIDO = 16
