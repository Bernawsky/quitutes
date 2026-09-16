import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { enviarPushEntrega } from "@/lib/push"

/**
 * Avisa a pousada dona do pedido + os admins que o entregador marcou "entregue" ou desmarcou
 * ("voltou pra fila"). Chamado pelo app logo depois do toggle no /entregas. A mensagem é sempre
 * montada a partir do que está gravado no pedido, nunca do corpo da requisição — e a leitura
 * passa pelo cliente autenticado (RLS já restringe quem pode ver o pedido).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const { data: papel } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "entregador"]).maybeSingle()
  if (!papel) return NextResponse.json({ error: "Acesso negado." }, { status: 403 })

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, pousada, pousada_id, saudacao, titulo, data_pedido, entregue")
    .eq("id", pedidoId)
    .maybeSingle()
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 })

  const nome = pedido.pousada ?? "Pousada"
  const quemOuQuando = pedido.saudacao || pedido.titulo || pedido.data_pedido
  const mensagem = pedido.entregue
    ? `Pedido de ${nome} foi entregue: ${quemOuQuando}`
    : `Pedido de ${nome} saiu para entrega: ${quemOuQuando}`

  const admin = createAdminSupabaseClient()
  let pousadaAuthUserId: string | null = null
  if (pedido.pousada_id) {
    const { data: pousada } = await admin.from("pousadas").select("auth_user_id").eq("id", pedido.pousada_id).maybeSingle()
    pousadaAuthUserId = pousada?.auth_user_id ?? null
  }

  await Promise.all([
    admin.from("eventos").insert({ tipo: "entrega", pedido_id: pedido.id, pousada: nome, mensagem }),
    enviarPushEntrega(pousadaAuthUserId, { titulo: pedido.entregue ? "Pedido entregue" : "Saiu para entrega", corpo: mensagem, url: "/" }),
  ])

  return NextResponse.json({ ok: true })
}
