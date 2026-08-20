export type UnidadeBase = { nome: string; isSuite?: boolean }

export type Pousada = {
  slug: string
  nome: string
  usuario: string
  senha: string
  subtitulo: string
  unidades: UnidadeBase[]
  /** Horários disponíveis para esta pousada. Quando há só um, ele já vem fixo/selecionado. */
  horarios: readonly string[]
}

const VALE_DO_SOL_UNIDADES: UnidadeBase[] = [
  ...Array.from({ length: 10 }, (_, i) => ({ nome: `Chalé ${i + 1}` })),
  { nome: "Suíte", isSuite: true },
]

const ALQUIMIA_UNIDADES: UnidadeBase[] = [
  "Quartzo Rosa",
  "Amolite",
  "Rubi",
  "Topázio",
  "Turquesa",
  "Ágata",
  "Olho de Tigre",
  "Ametista",
  "Turmalina",
  "Safira",
  "Esmeralda",
].map((nome) => ({ nome }))

const SERTAO_UNIDADES: UnidadeBase[] = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
].map((n) => ({ nome: `Quarto ${n}` }))

const ITAOKA_UNIDADES: UnidadeBase[] = ["Realize", "Acredite", "Sonhe", "Inspire", "Gratidão"].map((nome) => ({
  nome: `Chalé ${nome}`,
}))

const DESTINO_DE_NOIVA_UNIDADES: UnidadeBase[] = [{ nome: "Chalé D. de Noiva" }]

const CABANA_ALPINA_UNIDADES: UnidadeBase[] = ["Cabana Orinal", "Cabana 2", "Cabana 3"].map((nome) => ({ nome }))

export const POUSADAS: Pousada[] = [
  {
    slug: "vale-do-sol",
    nome: "Vale do Sol",
    usuario: "Vale do Sol",
    senha: "1054",
    subtitulo: "Monte os pedidos e envie no grupo do WhatsApp",
    unidades: VALE_DO_SOL_UNIDADES,
    horarios: ["6:30", "8:00"],
  },
  {
    slug: "alquimia-chales",
    nome: "Alquimia Chalés",
    usuario: "Alquimia Chalés",
    senha: "8235",
    subtitulo: "Monte os pedidos dos chalés e envie no grupo do WhatsApp",
    unidades: ALQUIMIA_UNIDADES,
    horarios: ["8:00"],
  },
  {
    slug: "ser-tao",
    nome: "Ser.Tão",
    usuario: "Ser.Tão",
    senha: "1882",
    subtitulo: "Monte os pedidos dos quartos e envie no grupo do WhatsApp",
    unidades: SERTAO_UNIDADES,
    horarios: ["7:00", "8:00"],
  },
  {
    slug: "itaoka-belvedere",
    nome: "Itaoka Belvedere",
    usuario: "Itaoka Belvedere",
    senha: "1313",
    subtitulo: "Monte os pedidos dos chalés e envie no grupo do WhatsApp",
    unidades: ITAOKA_UNIDADES,
    horarios: ["8:30"],
  },
  {
    slug: "destino-de-noiva",
    nome: "Destino de Noiva",
    usuario: "Destino de Noiva",
    senha: "8773",
    subtitulo: "Monte os pedidos dos chalés e envie no grupo do WhatsApp",
    unidades: DESTINO_DE_NOIVA_UNIDADES,
    horarios: ["7:00", "9:00"],
  },
  {
    slug: "cabana-alpina",
    nome: "Cabana Alpina",
    usuario: "Cabana Alpina",
    senha: "9581",
    subtitulo: "Monte os pedidos das cabanas e envie no grupo do WhatsApp",
    unidades: CABANA_ALPINA_UNIDADES,
    horarios: ["9:00"],
  },
]

export function pousadaPorSlug(slug: string | null | undefined): Pousada | null {
  return POUSADAS.find((p) => p.slug === slug) ?? null
}

export function pousadaPorNome(nome: string | null | undefined): Pousada | null {
  if (!nome) return null
  return POUSADAS.find((p) => p.nome === nome) ?? null
}

function normalizar(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/** Valida usuário + senha de uma pousada. Retorna a pousada quando confere. */
export function autenticarPousada(usuario: string, senha: string): Pousada | null {
  const u = normalizar(usuario)
  const p = POUSADAS.find((item) => normalizar(item.usuario) === u)
  if (!p) return null
  return p.senha === senha.trim() ? p : null
}
