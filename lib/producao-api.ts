import type { DiaProducao } from "@/lib/producao"

/**
 * Persistência local (localStorage do navegador) — não depende mais de nenhum backend.
 * O Supabase que guardava isso foi excluído; a única pessoa que ainda usa essa ferramenta
 * (/producao) passou a ter os dados salvos no próprio navegador dela.
 */
const CHAVE_RASCUNHO = "quitutes-producao-rascunho"
const CHAVE_HISTORICO = "quitutes-producao-historico"

/** Produções concluídas há mais de 30 dias são apagadas sozinhas (pedido explícito: não acumular pra sempre). */
const RETENCAO_HISTORICO_DIAS = 30

function lerJSON<T>(chave: string, vazio: T): T {
  if (typeof window === "undefined") return vazio
  try {
    const bruto = window.localStorage.getItem(chave)
    if (!bruto) return vazio
    return JSON.parse(bruto) as T
  } catch {
    return vazio
  }
}

function salvarJSON(chave: string, valor: unknown): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(chave, JSON.stringify(valor))
}

/** Lê o rascunho salvo. Se ainda não existir nada, retorna vazio (não é erro). */
export async function getRascunho(): Promise<DiaProducao[]> {
  return lerJSON<DiaProducao[]>(CHAVE_RASCUNHO, [])
}

/** Autosave do rascunho atual. */
export async function salvarRascunho(dias: DiaProducao[]): Promise<void> {
  salvarJSON(CHAVE_RASCUNHO, dias)
}

export type ProducaoConcluida = {
  id: string
  dias: DiaProducao[]
  concluido_em: string
}

/** Remove do histórico qualquer produção concluída há mais de 30 dias, e persiste a remoção. */
function expurgarHistoricoAntigo(historico: ProducaoConcluida[]): ProducaoConcluida[] {
  const limite = Date.now() - RETENCAO_HISTORICO_DIAS * 24 * 60 * 60 * 1000
  const mantidas = historico.filter((p) => new Date(p.concluido_em).getTime() >= limite)
  if (mantidas.length !== historico.length) salvarJSON(CHAVE_HISTORICO, mantidas)
  return mantidas
}

/**
 * Salva o rascunho atual como uma produção concluída (nova entrada no histórico) e zera o
 * rascunho — "concluir" literalmente limpa a calculadora e manda o que estava nela pro histórico.
 */
export async function concluirProducao(dias: DiaProducao[]): Promise<void> {
  const historico = lerJSON<ProducaoConcluida[]>(CHAVE_HISTORICO, [])
  const nova: ProducaoConcluida = { id: crypto.randomUUID(), dias, concluido_em: new Date().toISOString() }
  salvarJSON(CHAVE_HISTORICO, [nova, ...historico])
  salvarJSON(CHAVE_RASCUNHO, [])
}

/** Lista as produções já concluídas, mais recentes primeiro (e já expurga as com mais de 30 dias). */
export async function getProducoesConcluidas(): Promise<ProducaoConcluida[]> {
  const historico = expurgarHistoricoAntigo(lerJSON<ProducaoConcluida[]>(CHAVE_HISTORICO, []))
  return [...historico]
    .sort((a, b) => b.concluido_em.localeCompare(a.concluido_em))
    .slice(0, 100)
}

/** Edita uma produção já concluída (corrigir um erro de digitação depois do fato, por exemplo). */
export async function atualizarProducaoConcluida(id: string, dias: DiaProducao[]): Promise<void> {
  const historico = lerJSON<ProducaoConcluida[]>(CHAVE_HISTORICO, [])
  salvarJSON(
    CHAVE_HISTORICO,
    historico.map((p) => (p.id === id ? { ...p, dias } : p)),
  )
}

/** Exclui uma produção do histórico definitivamente. */
export async function excluirProducao(id: string): Promise<void> {
  const historico = lerJSON<ProducaoConcluida[]>(CHAVE_HISTORICO, [])
  salvarJSON(
    CHAVE_HISTORICO,
    historico.filter((p) => p.id !== id),
  )
}
