import { supabase } from "@/lib/supabase/client"
import type { DiaProducao } from "@/lib/producao"

/** Linha fixa usada como rascunho atual — sempre a mesma, atualizada por upsert (autosave). */
const RASCUNHO_ID = "00000000-0000-0000-0000-000000000001"

/** Lê o rascunho salvo. Se ainda não existir nenhuma linha, retorna vazio (não é erro). */
export async function getRascunho(): Promise<DiaProducao[]> {
  const { data, error } = await supabase.from("producoes").select("dias").eq("id", RASCUNHO_ID).maybeSingle()
  if (error) throw error
  return (data?.dias as unknown as DiaProducao[]) ?? []
}

/** Autosave do rascunho atual (upsert na linha fixa). */
export async function salvarRascunho(dias: DiaProducao[]): Promise<void> {
  const { error } = await supabase
    .from("producoes")
    .upsert({ id: RASCUNHO_ID, dias: dias as unknown as never, status: "rascunho" })
  if (error) throw error
}

/**
 * Salva o rascunho atual como uma produção concluída (nova linha no histórico) e zera o rascunho —
 * "concluir" literalmente limpa a calculadora e manda o que estava nela pro histórico.
 */
export async function concluirProducao(dias: DiaProducao[]): Promise<void> {
  const { error: erroInsert } = await supabase
    .from("producoes")
    .insert({ dias: dias as unknown as never, status: "concluido", concluido_em: new Date().toISOString() })
  if (erroInsert) throw erroInsert

  const { error: erroZerar } = await supabase
    .from("producoes")
    .upsert({ id: RASCUNHO_ID, dias: [] as unknown as never, status: "rascunho" })
  if (erroZerar) throw erroZerar
}

export type ProducaoConcluida = {
  id: string
  dias: DiaProducao[]
  concluido_em: string
}

/** Lista as produções já concluídas, mais recentes primeiro. */
export async function getProducoesConcluidas(): Promise<ProducaoConcluida[]> {
  const { data, error } = await supabase
    .from("producoes")
    .select("id, dias, concluido_em")
    .eq("status", "concluido")
    .order("concluido_em", { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as unknown as ProducaoConcluida[]
}
