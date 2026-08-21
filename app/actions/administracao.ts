"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

async function exigirAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
  if (error || !data) throw new Error("Acesso negado: apenas administradores.")
}

export type Administrador = { id: string; email: string; criadoEm: string }

/** Lista os administradores atuais (usa a service role porque user_roles só expõe o próprio papel via RLS). */
export async function listarAdministradores(): Promise<Administrador[]> {
  await exigirAdmin()
  const admin = createAdminSupabaseClient()

  const { data: papeis, error } = await admin.from("user_roles").select("user_id, created_at").eq("role", "admin")
  if (error) throw new Error(error.message)

  const administradores: Administrador[] = []
  for (const papel of papeis ?? []) {
    const { data } = await admin.auth.admin.getUserById(papel.user_id)
    administradores.push({ id: papel.user_id, email: data.user?.email ?? "(e-mail não encontrado)", criadoEm: papel.created_at })
  }
  return administradores
}

/** Convida um novo administrador por e-mail (dispara o e-mail de convite nativo do Supabase). */
export async function convidarAdmin(email: string): Promise<void> {
  await exigirAdmin()
  const enderecoLimpo = email.trim().toLowerCase()
  if (!enderecoLimpo || !enderecoLimpo.includes("@")) throw new Error("Informe um e-mail válido.")

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(enderecoLimpo)
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Não foi possível criar o convite.")

  const { error: erroPapel } = await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" })
  if (erroPapel) throw new Error(erroPapel.message)
}
