import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/** Lista pública mínima (nome + unidades) usada só para preencher os seletores do formulário de feedback. */
export async function GET() {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from("pousadas").select("id, nome, unidades").eq("ativa", true).order("nome")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pousadas: data ?? [] })
}
