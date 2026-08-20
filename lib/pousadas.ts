export type UnidadeBase = { nome: string; isSuite?: boolean }

export type Pousada = {
  slug: string
  nome: string
  usuario: string
  senha: string
  subtitulo: string
  unidades: UnidadeBase[]
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

export const POUSADAS: Pousada[] = [
  {
    slug: "vale-do-sol",
    nome: "Vale do Sol",
    usuario: "Vale do Sol",
    senha: "1054",
    subtitulo: "Monte os pedidos e envie no grupo do WhatsApp",
    unidades: VALE_DO_SOL_UNIDADES,
  },
  {
    slug: "alquimia-chales",
    nome: "Alquimia Chalés",
    usuario: "Alquimia Chalés",
    senha: "8235",
    subtitulo: "Monte os pedidos dos chalés e envie no grupo do WhatsApp",
    unidades: ALQUIMIA_UNIDADES,
  },
  {
    slug: "ser-tao",
    nome: "Pousada Ser.Tão",
    usuario: "Ser.Tão",
    senha: "1882",
    subtitulo: "Monte os pedidos dos quartos e envie no grupo do WhatsApp",
    unidades: SERTAO_UNIDADES,
  },
  {
    slug: "itaoka-belvedere",
    nome: "Pousada Itaoka Belvedere",
    usuario: "Itaoka Belvedere",
    senha: "1313",
    subtitulo: "Monte os pedidos dos chalés e envie no grupo do WhatsApp",
    unidades: ITAOKA_UNIDADES,
  },
]

export function pousadaPorSlug(slug: string | null | undefined): Pousada | null {
  return POUSADAS.find((p) => p.slug === slug) ?? null
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
