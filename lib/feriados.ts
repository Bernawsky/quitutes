import { dataLocal } from "@/lib/pedidos"

function paraISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), usado para calcular os feriados móveis. */
function pascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

/** Feriados nacionais fixos + móveis (baseados na Páscoa) de um ano. Chave = data ISO, valor = nome. */
export function feriadosDoAno(ano: number): Map<string, string> {
  const feriados = new Map<string, string>()
  feriados.set(paraISO(ano, 1, 1), "Confraternização Universal")
  feriados.set(paraISO(ano, 4, 21), "Tiradentes")
  feriados.set(paraISO(ano, 5, 1), "Dia do Trabalho")
  feriados.set(paraISO(ano, 9, 7), "Independência do Brasil")
  feriados.set(paraISO(ano, 10, 12), "Nossa Senhora Aparecida")
  feriados.set(paraISO(ano, 11, 2), "Finados")
  feriados.set(paraISO(ano, 11, 15), "Proclamação da República")
  feriados.set(paraISO(ano, 12, 25), "Natal")

  const domingoPascoa = pascoa(ano)
  const deslocar = (dias: number) => {
    const d = new Date(domingoPascoa)
    d.setDate(d.getDate() + dias)
    return paraISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }
  feriados.set(deslocar(-47), "Carnaval")
  feriados.set(deslocar(-2), "Sexta-feira Santa")
  feriados.set(deslocar(60), "Corpus Christi")

  return feriados
}

/** Nome do feriado nacional numa data (yyyy-mm-dd), ou null se não for feriado. */
export function nomeFeriado(dataISO: string): string | null {
  const ano = Number(dataISO.slice(0, 4))
  return feriadosDoAno(ano).get(dataISO) ?? null
}

/** true para sábado ou domingo. */
export function isFimDeSemana(dataISO: string): boolean {
  const dia = dataLocal(dataISO).getDay()
  return dia === 0 || dia === 6
}

/** Fim de semana ou feriado nacional — quando o Buffet costuma funcionar. */
export function isDiaBuffet(dataISO: string): boolean {
  return isFimDeSemana(dataISO) || nomeFeriado(dataISO) !== null
}
