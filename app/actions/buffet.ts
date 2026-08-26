"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

async function exigirAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
  if (error || !data) throw new Error("Acesso negado: apenas administradores.")
  return supabase
}

export async function getBuffetAtivo(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("configuracoes").select("buffet_ativo").eq("id", true).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.buffet_ativo ?? true
}

/** Liga/desliga o recebimento de novos vouchers de Buffet (admin). */
export async function definirBuffetAtivo(ativo: boolean): Promise<void> {
  const supabase = await exigirAdmin()
  const { error } = await supabase.from("configuracoes").update({ buffet_ativo: ativo }).eq("id", true)
  if (error) throw new Error(error.message)
}
