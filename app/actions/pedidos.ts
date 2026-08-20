"use server"

import { sql } from "@/lib/db"
import { contarItens, type Pedido, type UnidadePedido } from "@/lib/pedidos"
import { revalidatePath } from "next/cache"

export async function salvarPedido(input: {
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
}): Promise<{ id: number }> {
  const totalUnidades = input.unidades.length
  const totalItens = input.unidades.reduce((acc, u) => acc + contarItens(u.itens), 0)
  const totalPessoas = input.unidades.reduce((acc, u) => acc + (u.pessoas || 0), 0)

  const rows = await sql`
    INSERT INTO pedidos (titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas)
    VALUES (
      ${input.titulo},
      ${input.saudacao},
      ${JSON.stringify(input.unidades)}::jsonb,
      ${totalUnidades},
      ${totalItens},
      ${totalPessoas}
    )
    RETURNING id
  `

  revalidatePath("/metricas")
  return { id: (rows as { id: number }[])[0].id }
}

export async function getPedidos(): Promise<Pedido[]> {
  const rows = await sql`
    SELECT id, created_at, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas
    FROM pedidos
    ORDER BY created_at DESC
  `
  return rows as Pedido[]
}

export async function getPedidoPorId(id: number): Promise<Pedido | null> {
  const rows = await sql`
    SELECT id, created_at, titulo, saudacao, unidades, total_unidades, total_itens, total_pessoas
    FROM pedidos
    WHERE id = ${id}
  `
  return (rows as Pedido[])[0] ?? null
}

// Pousadas que já enviaram pedido hoje (usado para o painel de pendências no dashboard).
export async function getPousadasComPedidoHoje(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT u->>'pousadaId' AS pousada_id
    FROM pedidos, jsonb_array_elements(unidades) AS u
    WHERE created_at::date = now()::date
  `
  return (rows as { pousada_id: string }[]).map((r) => r.pousada_id).filter(Boolean)
}
