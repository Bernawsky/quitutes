export type UnidadeBase = { nome: string; isSuite?: boolean }

export type Pousada = {
  id: string
  slug: string
  nome: string
  usuario: string
  subtitulo: string
  unidades: UnidadeBase[]
  /** Horários disponíveis para esta pousada. Quando há só um, ele já vem fixo/selecionado. */
  horarios: readonly string[]
  /** Tags livres (ex: "buffet" — habilita a aba de voucher do Buffet). */
  tags?: string[]
}

/** E-mail sintético usado para autenticar a pousada no Supabase Auth (ela não tem e-mail real). */
export function pousadaEmailSintetico(slug: string): string {
  return `${slug}@pousadas.quitutes.internal`
}
