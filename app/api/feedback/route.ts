import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const TOKEN_RE = /^[0-9a-f-]{36}$/i

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === "string" ? body.token : ""
  const nota = Number(body?.nota)
  const comentario = typeof body?.comentario === "string" ? body.comentario.trim().slice(0, 500) : null

  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: "Link inválido." }, { status: 400 })
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return NextResponse.json({ error: "Escolha uma nota de 1 a 5." }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  const { data: pedido, error: erroPedido } = await admin
    .from("pedidos")
    .select("id")
    .eq("feedback_token", token)
    .maybeSingle()
  if (erroPedido) return NextResponse.json({ error: erroPedido.message }, { status: 500 })
  if (!pedido) return NextResponse.json({ error: "Link inválido." }, { status: 404 })

  const { error: erroInsert } = await admin
    .from("feedbacks")
    .insert({ pedido_id: pedido.id, nota, comentario: comentario || null })

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return NextResponse.json({ error: "Essa cesta já recebeu uma avaliação. Obrigado!" }, { status: 409 })
    }
    return NextResponse.json({ error: erroInsert.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
