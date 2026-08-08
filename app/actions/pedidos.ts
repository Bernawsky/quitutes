"use server"

import { sql } from "@/lib/db"
import { contarItens, type Pedido, type UnidadePedido } from "@/lib/pedidos"
import { revalidatePath } from "next/cache"

export async function salvarPedido(input: {
  titulo: string
  saudacao: string
  unidades: UnidadePedido[]
}) {
  const totalUnidades = input.unidades.length
  const totalItens = input.unidades.reduce((acc, u) => acc + contarItens(u.observacoes), 0)

  await sql`
    INSERT INTO pedidos (titulo, saudacao, unidades, total_unidades, total_itens)
    VALUES (
      ${input.titulo},
      ${input.saudacao},
      ${JSON.stringify(input.unidades)}::jsonb,
      ${totalUnidades},
      ${totalItens}
    )
  `

  revalidatePath("/metricas")
}

export async function getPedidos(): Promise<Pedido[]> {
  const rows = await sql`
    SELECT id, created_at, titulo, saudacao, unidades, total_unidades, total_itens
    FROM pedidos
    ORDER BY created_at DESC
  `
  return rows as Pedido[]
}
