export type TipoMassa = "massa_doce" | "pao_abobora"

type Ingrediente = { chave: string; nome: string; gramas: number }
type ReceitaBase = { nome: string; ingredientes: Ingrediente[] }

/**
 * Tabelas-base das receitas, em gramas. Escalar linearmente pelo peso total de massa
 * necessário reproduz exatamente as proporções informadas (baker's percentage) sem
 * reintroduzir arredondamento de percentual.
 */
export const RECEITAS: Record<TipoMassa, ReceitaBase> = {
  massa_doce: {
    nome: "Massa doce",
    ingredientes: [
      { chave: "farinha", nome: "Farinha", gramas: 90 },
      { chave: "acucar", nome: "Açúcar", gramas: 22.5 },
      { chave: "leite", nome: "Leite", gramas: 15 },
      { chave: "gelo", nome: "Gelo", gramas: 15 },
      { chave: "oleo", nome: "Óleo", gramas: 13.5 },
      { chave: "ovos", nome: "Ovos", gramas: 9.9 },
      { chave: "fermento", nome: "Fermento fresco", gramas: 3.75 },
      { chave: "sal", nome: "Sal", gramas: 0.37 },
    ],
  },
  pao_abobora: {
    nome: "Pão de abóbora",
    ingredientes: [
      { chave: "farinha", nome: "Farinha", gramas: 1000 },
      { chave: "abobora", nome: "Abóbora cozida", gramas: 500 },
      { chave: "acucar", nome: "Açúcar", gramas: 200 },
      { chave: "oleo", nome: "Óleo", gramas: 150 },
      { chave: "ovos", nome: "Ovos", gramas: 100 },
      { chave: "fermento", nome: "Fermento fresco", gramas: 40 },
      { chave: "sal", nome: "Sal", gramas: 5 },
    ],
  },
}

export const TIPOS_MASSA: { valor: TipoMassa; nome: string }[] = [
  { valor: "massa_doce", nome: "Massa doce" },
  { valor: "pao_abobora", nome: "Pão de abóbora" },
]

function pesoBase(tipo: TipoMassa): number {
  return RECEITAS[tipo].ingredientes.reduce((soma, i) => soma + i.gramas, 0)
}

/** Escala a receita-base pro peso total de massa necessário (peso da unidade × quantidade de unidades). */
export function calcularIngredientes(tipo: TipoMassa, pesoTotalG: number): Ingrediente[] {
  const escala = pesoTotalG / pesoBase(tipo)
  return RECEITAS[tipo].ingredientes.map((i) => ({ ...i, gramas: i.gramas * escala }))
}

/** Formata em pt-BR: gramas abaixo de 1kg, quilos (3 casas, vírgula) a partir daí. */
export function formatarPeso(gramas: number): string {
  if (gramas >= 1000) {
    return `${(gramas / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`
  }
  return `${gramas.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} g`
}

/** Capacidade máxima da amassadeira elétrica — acima disso a massa precisa ser batida em mais de uma vez. */
export const CAPACIDADE_BATEDEIRA_G = 25_000

/**
 * Quantas vezes bater essa massa na amassadeira e o peso de cada batida (dividido em
 * partes iguais, nunca uma batida cheia no limite e outra pequena sobrando).
 */
export function calcularBatidas(pesoTotalG: number): { numero: number; pesoPorBatidaG: number } {
  const numero = Math.max(1, Math.ceil(pesoTotalG / CAPACIDADE_BATEDEIRA_G))
  return { numero, pesoPorBatidaG: pesoTotalG / numero }
}

/**
 * Quantas unidades cabem numa assadeira/lata, por peso de unidade. Os três valores conhecidos
 * (170g, 300g, 30g) somam ~1,5-1,7kg de massa por assadeira independente do tamanho do pão;
 * pesos fora dessa lista usam essa média (~1,6kg) como estimativa.
 */
const CAPACIDADE_ASSADEIRA_POR_PESO: Record<number, number> = {
  30: 56,
  85: 18,
  170: 10,
  300: 5,
}
const CAPACIDADE_ASSADEIRA_MEDIA_G = 1600

export function unidadesPorAssadeira(pesoUnidadeG: number): number {
  const conhecida = CAPACIDADE_ASSADEIRA_POR_PESO[pesoUnidadeG]
  if (conhecida) return conhecida
  return Math.max(1, Math.floor(CAPACIDADE_ASSADEIRA_MEDIA_G / pesoUnidadeG))
}

/** Quantas assadeiras/latas esse item precisa (arredondado pra cima). */
export function calcularLatas(item: ItemProducao): number {
  return Math.ceil(item.unidades / unidadesPorAssadeira(item.pesoUnidadeG))
}

/**
 * Catálogo fixo de pães — cada um já vem com a massa correta e o peso padrão da unidade, então a
 * pessoa só escolhe o pão (não precisa mais digitar sabor nem escolher a massa manualmente).
 * Pra adicionar um pão ou uma massa nova, é só acrescentar uma linha aqui.
 */
export type Pao = { nome: string; tipo: TipoMassa; pesoUnidadeG: number }

export const PAES: Pao[] = [
  { nome: "Pão de Canela Grande", tipo: "massa_doce", pesoUnidadeG: 170 },
  { nome: "Pão de Canela Pequeno", tipo: "massa_doce", pesoUnidadeG: 85 },
  { nome: "Pão de Chocolate", tipo: "massa_doce", pesoUnidadeG: 170 },
  { nome: "Pão de Chocolate com Café", tipo: "massa_doce", pesoUnidadeG: 170 },
  { nome: "Pão de Pizza", tipo: "massa_doce", pesoUnidadeG: 300 },
  { nome: "Pão Doce de Leite", tipo: "massa_doce", pesoUnidadeG: 85 },
  { nome: "Pão de Queijo e Orégano", tipo: "massa_doce", pesoUnidadeG: 85 },
  { nome: "Pão de Goiabada e Queijo", tipo: "massa_doce", pesoUnidadeG: 85 },
  { nome: "Pão de Abóbora", tipo: "pao_abobora", pesoUnidadeG: 30 },
]

export function buscarPao(nome: string): Pao {
  return PAES.find((p) => p.nome === nome) ?? PAES[0]
}

export type ItemProducao = {
  id: string
  tipo: TipoMassa
  sabor: string
  unidades: number
  pesoUnidadeG: number
}

export type DiaProducao = {
  id: string
  /** Data ISO (yyyy-mm-dd) escolhida no calendário — cada dia de produção é um dia real, não um nome livre. */
  data: string
  itens: ItemProducao[]
}

let proximoId = 1
function gerarId(): string {
  return `item-${proximoId++}`
}

/** Formata a data do dia pra exibição: "Quarta-feira, 14/10". */
export function formatarDiaProducao(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number)
  const dataLocal = new Date(ano, mes - 1, dia)
  const diaSemana = dataLocal.toLocaleDateString("pt-BR", { weekday: "long" })
  const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
  return `${diaSemanaCapitalizado}, ${dataLocal.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
}

export function novoItem(): ItemProducao {
  const primeiroPao = PAES[0]
  return { id: gerarId(), tipo: primeiroPao.tipo, sabor: primeiroPao.nome, unidades: 1, pesoUnidadeG: primeiroPao.pesoUnidadeG }
}

export function novoDia(data: string): DiaProducao {
  return { id: gerarId(), data, itens: [novoItem()] }
}

/** Agrupa os itens de um dia por tipo de massa, somando o peso total de cada grupo. */
export function agruparPorTipo(itens: ItemProducao[]): { tipo: TipoMassa; pesoTotalG: number; itens: ItemProducao[] }[] {
  const grupos = new Map<TipoMassa, ItemProducao[]>()
  for (const item of itens) {
    const lista = grupos.get(item.tipo) ?? []
    lista.push(item)
    grupos.set(item.tipo, lista)
  }
  return TIPOS_MASSA.filter((t) => grupos.has(t.valor)).map(({ valor }) => {
    const itensDoTipo = grupos.get(valor)!
    const pesoTotalG = itensDoTipo.reduce((soma, i) => soma + i.unidades * i.pesoUnidadeG, 0)
    return { tipo: valor, pesoTotalG, itens: itensDoTipo }
  })
}
