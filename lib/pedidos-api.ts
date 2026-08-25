import { supabase } from "@/lib/supabase/client"
import { amanhaISO, contarItens, type Pedido, type UnidadePedido } from "@/lib/pedidos"
import { calcularTotais, validarUnidades } from "@/lib/pedidos-validacao"

const COLUNAS =
  "id, created_at, pousada, pousada_id, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas, status, motivo_cancelamento, cancelado_at, updated_at, data_pedido"

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

  const { error } = await supabase.from("pedidos").insert({
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

  if (error) throw error
}

export type LogPedido = {
  id: number
  pedido_id: number
  pousada_id: string | null
  acao: string
  motivo: string | null
  dados_anteriores: { titulo?: string; saudacao?: string } | null
  dados_novos: { titulo?: string; saudacao?: string } | null
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
