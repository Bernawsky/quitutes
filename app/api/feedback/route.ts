import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const TOKEN_RE = /^[0-9a-f-]{36}$/i

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === "string" ? body.token : ""
  const nome = typeof body?.nome === "string" ? body.nome.trim().slice(0, 120) : ""
  const whatsapp = typeof body?.whatsapp === "string" ? body.whatsapp.trim().slice(0, 30) : ""
  const comentario = typeof body?.comentario === "string" ? body.comentario.trim().slice(0, 500) : ""
  const pousadaIdEntrada = typeof body?.pousadaId === "string" ? body.pousadaId : ""
  const unidadeEntrada = typeof body?.unidade === "string" ? body.unidade.trim().slice(0, 120) : ""

  if (!nome) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 })
  if (!comentario) return NextResponse.json({ error: "Escreva seu feedback." }, { status: 400 })

  const admin = createAdminSupabaseClient()
  let pedidoId: number | null = null
  let pousadaId: string | null = null
  let unidade: string | null = null

  if (token) {
    if (!TOKEN_RE.test(token)) return NextResponse.json({ error: "Link inválido." }, { status: 400 })

    const { data: pedido, error: erroPedido } = await admin
      .from("pedidos")
      .select("id, pousada_id, unidades")
      .eq("feedback_token", token)
      .maybeSingle()
    if (erroPedido) return NextResponse.json({ error: erroPedido.message }, { status: 500 })
    if (!pedido) return NextResponse.json({ error: "Link inválido." }, { status: 404 })

    const unidadesDoPedido = (pedido.unidades as { unidade: string }[] | null) ?? []
    if (!unidadesDoPedido.some((u) => u.unidade === unidadeEntrada)) {
      return NextResponse.json({ error: "Selecione um dos quartos/chalés desse pedido." }, { status: 400 })
    }

    pedidoId = pedido.id
    pousadaId = pedido.pousada_id
    unidade = unidadeEntrada
  } else {
    if (!pousadaIdEntrada) return NextResponse.json({ error: "Selecione a pousada." }, { status: 400 })
    if (!unidadeEntrada) return NextResponse.json({ error: "Selecione o quarto/chalé." }, { status: 400 })

    const { data: pousada, error: erroPousada } = await admin
      .from("pousadas")
      .select("id, unidades")
      .eq("id", pousadaIdEntrada)
      .eq("ativa", true)
      .maybeSingle()
    if (erroPousada) return NextResponse.json({ error: erroPousada.message }, { status: 500 })
    if (!pousada) return NextResponse.json({ error: "Pousada inválida." }, { status: 404 })

    const unidadesDaPousada = (pousada.unidades as { nome: string }[] | null) ?? []
    if (!unidadesDaPousada.some((u) => u.nome === unidadeEntrada)) {
      return NextResponse.json({ error: "Selecione um quarto/chalé válido dessa pousada." }, { status: 400 })
    }

    pousadaId = pousada.id
    unidade = unidadeEntrada
  }

  const { error: erroInsert } = await admin
    .from("feedbacks")
    .insert({ pedido_id: pedidoId, pousada_id: pousadaId, unidade, nome, whatsapp: whatsapp || null, comentario })

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return NextResponse.json({ error: "Essa cesta já recebeu uma avaliação. Obrigado!" }, { status: 409 })
    }
    return NextResponse.json({ error: erroInsert.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
