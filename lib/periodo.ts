export type Periodo = "dia" | "semana" | "mes" | "ano"

export const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "ano", label: "Ano" },
]

export const LABEL_PERIODO: Record<Periodo, string> = {
  dia: "hoje",
  semana: "nos últimos 7 dias",
  mes: "neste mês",
  ano: "neste ano",
}

export function dentroDoPeriodo(dataStr: string, periodo: Periodo): boolean {
  const data = new Date(dataStr)
  const agora = new Date()
  switch (periodo) {
    case "dia":
      return data.toDateString() === agora.toDateString()
    case "semana": {
      const limite = new Date(agora)
      limite.setDate(agora.getDate() - 6)
      limite.setHours(0, 0, 0, 0)
      return data >= limite
    }
    case "mes":
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear()
    case "ano":
      return data.getFullYear() === agora.getFullYear()
  }
}

export function chaveGrafico(dataStr: string, periodo: Periodo): string {
  const data = new Date(dataStr)
  if (periodo === "dia") {
    return `${String(data.getHours()).padStart(2, "0")}h`
  }
  if (periodo === "semana") {
    return data.toLocaleDateString("pt-BR", { weekday: "short" })
  }
  if (periodo === "mes") {
    return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`
  }
  return data.toLocaleDateString("pt-BR", { month: "short" })
}
