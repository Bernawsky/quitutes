import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/** Salva a inscrição de push do navegador do usuário logado (admin, pousada ou equipe). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : null
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : null
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Inscrição inválida" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from("push_subscriptions").upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
