import { supabase } from "@/lib/supabase/client"
import { amanhaISO, contarItens, hojeISO, unidadeBuffet, type Feedback, type Pedido, type UnidadePedido } from "@/lib/pedidos"
import { calcularTotais, validarUnidades } from "@/lib/pedidos-validacao"

const COLUNAS =
  "id, created_at, pousada, pousada_id, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas, status, motivo_cancelamento, cancelado_at, updated_at, data_pedido, feedback_token, tipo"

/** Avisa admins/equipe (push + log de eventos) sobre um pedido. Best-effort: não bloqueia o fluxo se falhar. */
export function notificarEvento(tipo: "novo_pedido" | "edicao" | "cancelamento" | "buffet_novo", pedidoId: number) {
  return fetch("/api/notificar/evento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, pedidoId }),
  }).catch(() => {})
}

export async function salvarPedido(input: {
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
  pousadaId: string
  pousada: string
  /** Data de entrega (yyyy-mm-dd) — padrão amanhã, que é quando a cesta normalmente é servida. */
  dataPedido?: string
}) {
  const totalUnidades = input.unidades.length
  const totalItens = input.unidades.reduce((acc, u) => acc + contarItens(u.itens), 0)
  const totalPessoas = input.unidades.reduce((acc, u) => acc + (u.pessoas || 0), 0)

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      titulo: input.titulo,
      pousada: input.pousada,
      pousada_id: input.pousadaId,
      saudacao: input.saudacao,
      unidades: input.unidades as never,
      total_unidades: totalUnidades,
      total_itens: totalItens,
      total_pessoas: totalPessoas,
      data_pedido: input.dataPedido ?? amanhaISO(),
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id as number
}

/** Registra um voucher de Buffet (RLS só permite para pousadas com a tag "buffet" e com o buffet ativo). */
export async function salvarPedidoBuffet(input: {
  pousadaId: string
  pousada: string
  pessoas: number
  hospede: string
  dataPedido: string
}) {
  const hospede = input.hospede.trim().slice(0, 200)
  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      tipo: "buffet",
      titulo: hospede,
      saudacao: hospede,
      pousada: input.pousada,
      pousada_id: input.pousadaId,
      unidades: [unidadeBuffet(input.pessoas)] as never,
      total_unidades: 1,
      total_itens: 0,
      total_pessoas: input.pessoas,
      data_pedido: input.dataPedido,
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id as number
}

/** Datas (yyyy-mm-dd) com pedido de cesta ativo, últimos 60 dias em diante — usado para pintar o calendário. */
export async function getDatasComPedidosCesta(): Promise<string[]> {
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 60)
  const inicioISO = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-${String(inicio.getDate()).padStart(2, "0")}`

  const { data, error } = await supabase
    .from("pedidos")
    .select("data_pedido")
    .eq("tipo", "cesta")
    .eq("status", "ativo")
    .gte("data_pedido", inicioISO)
  if (error) throw error
  return Array.from(new Set((data ?? []).map((d) => d.data_pedido)))
}

/** Vouchers de Buffet (RLS: admins veem todos). Sem data, traz os mais recentes primeiro. */
export async function getPedidosBuffet(dataISO?: string): Promise<Pedido[]> {
  let query = supabase.from("pedidos").select(COLUNAS).eq("tipo", "buffet")
  query = dataISO ? query.eq("data_pedido", dataISO) : query.gte("data_pedido", hojeISO())
  const { data, error } = await query.order("data_pedido", { ascending: false }).limit(200)
  if (error) throw error
  return (data ?? []) as unknown as Pedido[]
}

export type LogPedido = {
  id: number
  pedido_id: number
  pousada_id: string | null
  acao: string
  motivo: string | null
  dados_anteriores: { titulo?: string; saudacao?: string; tipo?: string } | null
  dados_novos: { titulo?: string; saudacao?: string; tipo?: string } | null
  criado_por: string | null
  created_at: string
}

/** Histórico de edições/cancelamentos (RLS: admins veem tudo, pousada só o próprio). */
export async function getHistoricoPedidos(): Promise<LogPedido[]> {
  const { data, error } = await supabase.from("pedidos_log").select("*").order("created_at", { ascending: false }).limit(200)
  if (error) throw error
  return (data ?? []) as unknown as LogPedido[]
}

/** Usado pelo dashboard administrativo (RLS restringe a leitura a admins). */
export async function getPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase.from("pedidos").select(COLUNAS).order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Pedido[]
}

/** Pedidos da própria pousada logada (RLS restringe via pousada_id). */
export async function getMeusPedidos(pousadaId: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(COLUNAS)
    .eq("pousada_id", pousadaId)
    .order("data_pedido", { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as unknown as Pedido[]
}

/** Edita um pedido próprio (a pousada só edita o que é dela, enquanto ativo e antes da data de entrega — garantido pelo RLS). */
export async function editarPedidoPousada(input: { id: number; saudacao: string; unidades: unknown }): Promise<Pedido> {
  const unidades = validarUnidades(input.unidades)
  const totais = calcularTotais(unidades)
  const saudacao = String(input.saudacao ?? "").trim().slice(0, 200)
  if (!saudacao) throw new Error("Informe a saudação do pedido.")

  const { data, error } = await supabase
    .from("pedidos")
    .update({ titulo: saudacao, saudacao, unidades: unidades as never, ...totais })
    .eq("id", input.id)
    .eq("status", "ativo")
    .select(COLUNAS)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Não foi possível editar: o prazo para alterar esse pedido já passou.")
  return data as unknown as Pedido
}

/** Cancela um pedido próprio. */
export async function cancelarPedidoPousada(input: { id: number; motivo?: string }): Promise<Pedido> {
  const motivo = String(input.motivo ?? "").trim().slice(0, 280)

  const { data, error } = await supabase
    .from("pedidos")
    .update({ status: "cancelado", motivo_cancelamento: motivo || null, cancelado_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("status", "ativo")
    .select(COLUNAS)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Não foi possível cancelar: o prazo para cancelar esse pedido já passou.")
  return data as unknown as Pedido
}

/** Pedidos de cesta ativos de uma data de entrega (RLS: admins e equipe da cozinha veem de todas as pousadas). */
export async function getPedidosPorData(dataISO: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(COLUNAS)
    .eq("data_pedido", dataISO)
    .eq("status", "ativo")
    .eq("tipo", "cesta")
    .order("pousada", { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Pedido[]
}

/** Feedbacks recebidos (RLS: admins veem todos, pousada só os dos próprios pedidos). */
export async function getFeedbacks(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select(
      "id, pedido_id, pousada_id, unidade, nome, whatsapp, comentario, created_at, pedido:pedidos(id, pousada, saudacao, data_pedido), pousada:pousadas(id, nome)",
    )
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Feedback[]
}
