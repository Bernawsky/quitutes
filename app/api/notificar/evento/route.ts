import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { enviarPushEquipe } from "@/lib/push"

type Tipo = "novo_pedido" | "edicao" | "cancelamento" | "buffet_novo"
const TIPOS: Tipo[] = ["novo_pedido", "edicao", "cancelamento", "buffet_novo"]

const TITULOS: Record<Tipo, string> = {
  novo_pedido: "Novo pedido",
  edicao: "Pedido editado",
  cancelamento: "Pedido cancelado",
  buffet_novo: "Novo voucher de Buffet",
}

/**
 * Registra um evento (novo pedido / edição / cancelamento / voucher de buffet) e avisa
 * admins e equipe por push. Chamado pelo app logo após a ação bem-sucedida no banco.
 * A mensagem é sempre montada a partir do que está gravado no pedido — nunca do corpo
 * da requisição — e a leitura passa pelo cliente autenticado (RLS), então só é possível
 * gerar evento para um pedido que a própria sessão pode enxergar.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const tipo = body?.tipo as Tipo
  const pedidoId = Number(body?.pedidoId)
  if (!TIPOS.includes(tipo) || !Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, pousada, saudacao, titulo, data_pedido, status, tipo, total_pessoas, motivo_cancelamento")
    .eq("id", pedidoId)
    .maybeSingle()
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 })
  if (tipo === "cancelamento" && pedido.status !== "cancelado") {
    return NextResponse.json({ error: "Pedido não está cancelado." }, { status: 409 })
  }
  if (tipo === "buffet_novo" && pedido.tipo !== "buffet") {
    return NextResponse.json({ error: "Pedido não é um voucher de buffet." }, { status: 409 })
  }

  const nome = pedido.pousada ?? "Pousada"
  const quemOuQuando = pedido.saudacao || pedido.titulo || pedido.data_pedido
  const mensagens: Record<Tipo, string> = {
    novo_pedido: `${nome} enviou um novo pedido: ${quemOuQuando}`,
    edicao: `${nome} editou o pedido #${pedido.id}: ${quemOuQuando}`,
    cancelamento: `${nome} cancelou o pedido #${pedido.id}${pedido.motivo_cancelamento ? ` — ${pedido.motivo_cancelamento}` : ""}`,
    buffet_novo: `${nome} enviou um voucher de Buffet para ${pedido.data_pedido}: ${pedido.total_pessoas} pessoa(s)`,
  }
  const mensagem = mensagens[tipo]

  const admin = createAdminSupabaseClient()
  await admin.from("eventos").insert({ tipo, pedido_id: pedido.id, pousada: nome, mensagem })

  await enviarPushEquipe({ titulo: TITULOS[tipo], corpo: mensagem, url: tipo === "buffet_novo" ? "/vouchers" : "/metricas/pedidos" })

  return NextResponse.json({ ok: true })
}
