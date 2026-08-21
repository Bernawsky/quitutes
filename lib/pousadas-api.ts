import { supabase } from "@/lib/supabase/client"
import type { Pousada } from "@/lib/pousadas"

const COLUNAS = "id, slug, nome, usuario, subtitulo, horarios, unidades"

export async function getPousadas(): Promise<Pousada[]> {
  const { data, error } = await supabase.from("pousadas").select(COLUNAS).eq("ativa", true).order("nome")
  if (error) throw error
  return (data ?? []) as unknown as Pousada[]
}

export async function getPousadaPorSlug(slug: string): Promise<Pousada | null> {
  const { data, error } = await supabase.from("pousadas").select(COLUNAS).eq("slug", slug).maybeSingle()
  if (error) throw error
  return (data ?? null) as unknown as Pousada | null
}

export async function getPousadaPorAuthUser(userId: string): Promise<Pousada | null> {
  const { data, error } = await supabase.from("pousadas").select(COLUNAS).eq("auth_user_id", userId).maybeSingle()
  if (error) throw error
  return (data ?? null) as unknown as Pousada | null
}

/** Cria uma nova pousada (RPC auto-protegida: só executa se quem chama for admin). */
export async function criarPousada(input: {
  slug: string
  nome: string
  usuario: string
  senha: string
  subtitulo: string
  horarios: string[]
  unidades: { nome: string; isSuite?: boolean }[]
}): Promise<void> {
  const { error } = await supabase.rpc("criar_pousada", {
    _slug: input.slug,
    _nome: input.nome,
    _usuario: input.usuario,
    _senha: input.senha,
    _subtitulo: input.subtitulo,
    _horarios: input.horarios as never,
    _unidades: input.unidades as never,
  })
  if (error) throw new Error(error.message)
}

/** Redefine a senha de uma pousada (RPC auto-protegida: só executa se quem chama for admin). */
export async function redefinirSenhaPousada(pousadaId: string, novaSenha: string): Promise<void> {
  const { error } = await supabase.rpc("redefinir_senha_pousada", { _pousada_id: pousadaId, _nova_senha: novaSenha })
  if (error) throw new Error(error.message)
}
