// União de todos os horários possíveis entre pousadas (cada pousada usa um subconjunto, ver lib/pousadas.ts).
export const HORARIOS = ["6:30", "7:00", "8:00", "8:30", "9:00"] as const
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

// Opções de cesta especial (aparecem em negrito na mensagem do WhatsApp)
export const DIETAS = [
  { key: "vegana", label: "Cesta vegana" },
  { key: "vegetariana", label: "Cesta vegetariana" },
  { key: "semGluten", label: "Cesta sem glúten" },
  { key: "semLactose", label: "Cesta sem lactose" },
] as const
export type DietaKey = (typeof DIETAS)[number]["key"]

export const LINK_GRUPO = "https://chat.whatsapp.com/JBiJEQHZATBBhfA3e9ji3p"

// Normaliza horários antigos ("6:30hrs", "8hrs") para o novo formato
export function normalizarHorario(horario: string): string {
  const bruto = (horario ?? "").trim()
  if ((HORARIOS as readonly string[]).includes(bruto)) return bruto

  const h = bruto.toLowerCase().replace("hrs", "").replace("h", "").trim()
  if (h.startsWith("6")) return "6:30"
  if (h.startsWith("7")) return "7:00"
  if (h.startsWith("8:3") || h.startsWith("8.3") || h === "830") return "8:30"
  if (h.startsWith("8")) return "8:00"
  if (h.startsWith("9")) return "9:00"
  return horario
}

// Total de itens (soma das quantidades) para métricas de volume
export function contarItens(itens: Itens): number {
  return Object.values(itens ?? {}).reduce((total, qtd) => total + (qtd || 0), 0)
}

// Descreve os itens preenchidos como texto: ["2 Ovos mexidos", ...]
export function descreverItens(itens: Itens): string[] {
  return ITENS.filter((it) => (itens?.[it.key] ?? 0) > 0).map((it) => `${itens[it.key]} ${it.label}`)
}

export type UnidadePedido = {
  unidade: string
  horario: string
  pessoas: number
  itens: Itens
  dietas?: string[]
  observacao?: string
}

export type Pedido = {
  id: number
  created_at: string
  pousada?: string
  pousada_id?: string | null
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
  total_unidades: number
  total_itens: number
  total_pessoas: number
  status?: string
  motivo_cancelamento?: string | null
  cancelado_at?: string | null
  updated_at?: string
  data_pedido: string
  feedback_token?: string
}

function formatarSaudacao(d: Date): string {
  const semana = d.toLocaleDateString("pt-BR", { weekday: "long" })
  const dia = String(d.getDate()).padStart(2, "0")
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const ano = String(d.getFullYear()).slice(-2)
  return `☕Olá, café para (${semana}) ${dia}/${mes}/${ano}`
}

// A cesta é uma encomenda: enviada hoje, mas sempre para o dia seguinte (padrão sem antecipação).
export function dataSaudacao(d = new Date()): string {
  const amanha = new Date(d)
  amanha.setDate(amanha.getDate() + 1)
  return formatarSaudacao(amanha)
}

/** Mesma saudação, mas para uma data de entrega (yyyy-mm-dd) escolhida diretamente — usado ao antecipar pedidos. */
export function dataSaudacaoPara(dataPedidoISO: string): string {
  return formatarSaudacao(dataLocal(dataPedidoISO))
}

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Data (yyyy-mm-dd, fuso local) de hoje. */
export function hojeISO(): string {
  return paraISO(new Date())
}

/**
 * Converte "yyyy-mm-dd" num Date à meia-noite local. `new Date("yyyy-mm-dd")` interpreta
 * como UTC, o que desloca o dia em fusos negativos (ex: Brasil) — por isso não usamos direto.
 */
export function dataLocal(dataISO: string): Date {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  return new Date(ano!, mes! - 1, dia!)
}

/** Data (yyyy-mm-dd, fuso local) de amanhã — quando um pedido normal (não antecipado) é servido. */
export function amanhaISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return paraISO(d)
}

/** Só é possível editar/cancelar enquanto a data de entrega ainda não chegou (até a véspera). */
export function podeEditarPedido(pedido: Pick<Pedido, "data_pedido">): boolean {
  return pedido.data_pedido > hojeISO()
}

/** "Hoje", "Amanhã" ou a data por extenso, a partir de uma data yyyy-mm-dd. */
export function rotuloData(dataISO: string): string {
  if (dataISO === hojeISO()) return "Hoje"
  if (dataISO === amanhaISO()) return "Amanhã"
  return dataLocal(dataISO).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
}

// Observações de uma unidade: dietas em negrito + itens + texto livre
export function observacoesUnidade(u: UnidadePedido): string[] {
  const partes: string[] = []
  for (const d of DIETAS) {
    if (u.dietas?.includes(d.key)) partes.push(`*${d.label}*`)
  }
  partes.push(...descreverItens(u.itens ?? {}))
  if (u.observacao?.trim()) partes.push(u.observacao.trim())
  return partes
}

export function linhaUnidade(u: UnidadePedido): string {
  const obs = observacoesUnidade(u)
  const pessoas = `${u.pessoas} ${u.pessoas === 1 ? "pessoa" : "pessoas"}`
  return `- ${u.unidade} — ${pessoas}${obs.length ? ` (${obs.join(", ")})` : ""}`
}

/** Monta a mensagem do WhatsApp agrupada por horário. */
export function gerarMensagem(saudacao: string, unidades: UnidadePedido[]): string {
  const linhas: string[] = []
  if (saudacao.trim()) linhas.push(saudacao.trim())

  const grupos = new Map<string, UnidadePedido[]>()
  for (const u of unidades) {
    const h = normalizarHorario(u.horario)
    const lista = grupos.get(h) ?? []
    lista.push(u)
    grupos.set(h, lista)
  }

  const ordem = [...grupos.keys()].sort((a, b) => {
    const idx = (v: string) => (HORARIOS as readonly string[]).indexOf(v)
    return (idx(a) === -1 ? 99 : idx(a)) - (idx(b) === -1 ? 99 : idx(b))
  })

  for (const h of ordem) {
    linhas.push(`*${h}*`)
    for (const u of grupos.get(h) ?? []) linhas.push(linhaUnidade(u))
  }

  const totalPessoas = unidades.reduce((acc, u) => acc + (u.pessoas || 0), 0)
  linhas.push(`Total: ${totalPessoas} pessoas`)

  return linhas.join("\n")
}

/** Mensagem enviada quando um pedido inteiro é cancelado. */
export function gerarMensagemCancelamento(pedido: Pedido, motivo?: string): string {
  const unidades = pedido.unidades ?? []
  const unica = unidades.length === 1
  const base = pedido.saudacao?.trim() || pedido.titulo?.trim() || ""
  const linhas: string[] = []

  if (unica) {
    const u = unidades[0]!
    linhas.push("❌ *Cancelamento de cesta*")
    if (base) linhas.push(base)
    linhas.push(
      `A cesta do ${u.unidade} das ${normalizarHorario(u.horario)} foi cancelada. Favor desconsiderar o pedido.`,
    )
  } else {
    linhas.push("❌ *Cancelamento de pedido*")
    if (base) linhas.push(base)
    linhas.push("As cestas abaixo foram canceladas. Favor desconsiderar o pedido:")
    for (const u of unidades) {
      linhas.push(`- ${u.unidade} — ${normalizarHorario(u.horario)}`)
    }
  }

  if (motivo?.trim()) linhas.push(`Motivo: ${motivo.trim()}`)
  linhas.push("Obrigado pela compreensão! 🙏")
  return linhas.join("\n")
}

/** Mensagem enviada quando um pedido é editado. */
export function gerarMensagemEdicao(saudacao: string, unidades: UnidadePedido[]): string {
  return `✏️ *Atualização do pedido*\n${gerarMensagem(saudacao, unidades)}`
}
