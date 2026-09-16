import { supabase } from "@/lib/supabase/client"

export type Tema = "light" | "dark" | "system"
export type TamanhoFonte = "pequeno" | "medio" | "grande"
export type PreferenciasInterface = { tema: Tema; tamanho_fonte: TamanhoFonte }

const PADRAO: PreferenciasInterface = { tema: "system", tamanho_fonte: "medio" }

/** Preferências de aparência da conta (tema, tamanho da fonte) — sincronizadas entre dispositivos. */
export async function getPreferenciasInterface(userId: string): Promise<PreferenciasInterface> {
  const { data, error } = await supabase.from("preferencias_interface").select("tema, tamanho_fonte").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return data ? { tema: data.tema, tamanho_fonte: data.tamanho_fonte } : PADRAO
}

export async function salvarPreferenciasInterface(userId: string, preferencias: Partial<PreferenciasInterface>): Promise<void> {
  const { error } = await supabase
    .from("preferencias_interface")
    .upsert({ user_id: userId, ...preferencias, atualizado_em: new Date().toISOString() })
  if (error) throw error
}
