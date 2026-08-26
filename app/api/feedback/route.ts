import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const TOKEN_RE = /^[0-9a-f-]{36}$/i

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === "string" ? body.token : ""
  const nome = typeof body?.nome === "string" ? body.nome.trim().slice(0, 120) : ""
  const whatsapp = typeof body?.whatsapp === "string" ? body.whatsapp.trim().slice(0, 30) : ""
  const comentario = typeof body?.comentario === "string" ? body.comentario.trim().slice(0, 500) : ""

  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: "Link inválido." }, { status: 400 })
  if (!nome) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 })
  if (!comentario) return NextResponse.json({ error: "Escreva seu feedback." }, { status: 400 })

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
    .insert({ pedido_id: pedido.id, nome, whatsapp: whatsapp || null, comentario })

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return NextResponse.json({ error: "Essa cesta já recebeu uma avaliação. Obrigado!" }, { status: 409 })
    }
    return NextResponse.json({ error: erroInsert.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
