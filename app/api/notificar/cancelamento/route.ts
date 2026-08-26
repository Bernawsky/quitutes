import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { enviarWhatsapp, numerosDosAdmins } from "@/lib/whatsapp"

/**
 * Chamado pelo app logo após um cancelamento bem-sucedido, para avisar os admins.
 * Exige sessão da pousada dona do pedido e confere no banco que o pedido está
 * mesmo cancelado — antes, qualquer pessoa sem login podia forjar esse alerta
 * (pousada e motivo vinham direto do corpo da requisição, sem checagem nenhuma).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "pedidoId inválido" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  // RLS já restringe a leitura ao pedido da própria pousada logada.
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, pousada, status, motivo_cancelamento")
    .eq("id", pedidoId)
    .eq("status", "cancelado")
    .maybeSingle()
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado ou não cancelado." }, { status: 404 })

  const resultado = await enviarWhatsapp({
    destinatarios: numerosDosAdmins(),
    mensagem: `*${pedido.pousada}* cancelou o pedido #${pedido.id}.${pedido.motivo_cancelamento ? `\nMotivo: ${pedido.motivo_cancelamento}` : ""}`,
  })

  return NextResponse.json(resultado)
}
