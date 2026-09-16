import { supabase } from "@/lib/supabase/client"

/** Até qual id de `eventos` essa conta já limpou do sininho — persistido no banco, não em localStorage. */
export async function getLimpoAteId(userId: string): Promise<number> {
  const { data, error } = await supabase.from("notificacoes_limpas").select("limpo_ate_id").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return data?.limpo_ate_id ?? 0
}

/** Marca todos os avisos até `maiorId` como limpos pra essa conta, em qualquer dispositivo. */
export async function limparNotificacoes(userId: string, maiorId: number): Promise<void> {
  const { error } = await supabase.from("notificacoes_limpas").upsert({ user_id: userId, limpo_ate_id: maiorId, atualizado_em: new Date().toISOString() })
  if (error) throw error
}

export type PreferenciasNotificacao = { entregas_ativas: boolean }

/** Preferências de notificação da conta — hoje só o toggle de avisos de entrega (liga por padrão). */
export async function getPreferenciasNotificacao(userId: string): Promise<PreferenciasNotificacao> {
  const { data, error } = await supabase.from("preferencias_notificacao").select("entregas_ativas").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return { entregas_ativas: data?.entregas_ativas ?? true }
}

export async function salvarPreferenciasNotificacao(userId: string, preferencias: PreferenciasNotificacao): Promise<void> {
  const { error } = await supabase
    .from("preferencias_notificacao")
    .upsert({ user_id: userId, entregas_ativas: preferencias.entregas_ativas, atualizado_em: new Date().toISOString() })
  if (error) throw error
}
