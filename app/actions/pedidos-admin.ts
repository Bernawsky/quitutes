"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { calcularTotais, validarUnidades } from "@/lib/pedidos-validacao"
import type { Pedido } from "@/lib/pedidos"

async function exigirAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error || !data) throw new Error("Acesso negado: apenas administradores.")

  return supabase
}

/** Edita um pedido existente (validação completa no backend, RLS confere o papel admin). */
export async function editarPedido(input: { id: number; saudacao: string; unidades: unknown }): Promise<Pedido> {
  const supabase = await exigirAdmin()

  const id = Number(input.id)
  if (!Number.isInteger(id) || id <= 0) throw new Error("Pedido inválido.")

  const saudacao = String(input.saudacao ?? "").trim().slice(0, 200)
  if (!saudacao) throw new Error("Informe a saudação do pedido.")

  const unidades = validarUnidades(input.unidades)
  const totais = calcularTotais(unidades)

  const { data: atual, error: erroBusca } = await supabase.from("pedidos").select("id, status").eq("id", id).maybeSingle()
  if (erroBusca) throw new Error(erroBusca.message)
  if (!atual) throw new Error("Pedido não encontrado.")
  if (atual.status === "cancelado") throw new Error("Pedido cancelado não pode ser editado.")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: atualizado, error } = await supabase
    .from("pedidos")
    .update({
      titulo: saudacao,
      saudacao,
      unidades: unidades as never,
      ...totais,
      atualizado_por: user?.id,
    })
    .eq("id", id)
    .select(
      "id, created_at, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas, status, motivo_cancelamento, cancelado_at, updated_at",
    )
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!atualizado) throw new Error("Não foi possível atualizar o pedido.")
  return atualizado as unknown as Pedido
}

/** Cancela um pedido inteiro. */
export async function cancelarPedido(input: { id: number; motivo?: string }): Promise<Pedido> {
  const supabase = await exigirAdmin()

  const id = Number(input.id)
  if (!Number.isInteger(id) || id <= 0) throw new Error("Pedido inválido.")
  const motivo = String(input.motivo ?? "").trim().slice(0, 280)

  const { data: atual, error: erroBusca } = await supabase.from("pedidos").select("id, status").eq("id", id).maybeSingle()
  if (erroBusca) throw new Error(erroBusca.message)
  if (!atual) throw new Error("Pedido não encontrado.")
  if (atual.status === "cancelado") throw new Error("Este pedido já está cancelado.")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: cancelado, error } = await supabase
    .from("pedidos")
    .update({
      status: "cancelado",
      motivo_cancelamento: motivo || null,
      cancelado_at: new Date().toISOString(),
      atualizado_por: user?.id,
    })
    .eq("id", id)
    .select(
      "id, created_at, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas, status, motivo_cancelamento, cancelado_at, updated_at",
    )
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!cancelado) throw new Error("Não foi possível cancelar o pedido.")
  return cancelado as unknown as Pedido
}
