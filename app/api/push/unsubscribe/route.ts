import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/** Remove a inscrição de push do navegador atual (RLS garante que só a própria pode ser removida). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null
  if (!endpoint) return NextResponse.json({ error: "endpoint inválido" }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
  return NextResponse.json({ ok: true })
}
