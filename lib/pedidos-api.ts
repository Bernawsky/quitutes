import { supabase } from "@/lib/supabase/client"
import { contarItens, type Pedido, type UnidadePedido } from "@/lib/pedidos"

export async function salvarPedido(input: {
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
  pousada: string
}) {
  const totalUnidades = input.unidades.length
  const totalItens = input.unidades.reduce((acc, u) => acc + contarItens(u.itens), 0)
  const totalPessoas = input.unidades.reduce((acc, u) => acc + (u.pessoas || 0), 0)

  const { error } = await supabase.from("pedidos").insert({
    titulo: input.titulo,
    pousada: input.pousada,
    saudacao: input.saudacao,
    unidades: input.unidades as never,
    total_unidades: totalUnidades,
    total_itens: totalItens,
    total_pessoas: totalPessoas,
  })

  if (error) throw error
}

export async function getPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "id, created_at, pousada, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas, status, motivo_cancelamento, cancelado_at, updated_at",
    )
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Pedido[]
}
