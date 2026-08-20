"use server"

import { sql } from "@/lib/db"
import type { EstoqueItem } from "@/lib/estoque"
import { revalidatePath } from "next/cache"

async function ensureEstoqueTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS estoque_itens (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nome TEXT NOT NULL,
      unidade TEXT NOT NULL DEFAULT 'un',
      quantidade_atual NUMERIC NOT NULL DEFAULT 0,
      quantidade_minima NUMERIC NOT NULL DEFAULT 0,
      atualizado_em TIMESTAMPTZ DEFAULT now()
    )
  `
}

export async function getEstoque(): Promise<EstoqueItem[]> {
  await ensureEstoqueTable()
  const rows = await sql`
    SELECT id, nome, unidade, quantidade_atual, quantidade_minima, atualizado_em
    FROM estoque_itens
    ORDER BY nome ASC
  `
  return rows as EstoqueItem[]
}

export async function criarItemEstoque(input: {
  nome: string
  unidade: string
  quantidadeAtual: number
  quantidadeMinima: number
}) {
  await ensureEstoqueTable()
  await sql`
    INSERT INTO estoque_itens (nome, unidade, quantidade_atual, quantidade_minima)
    VALUES (${input.nome}, ${input.unidade}, ${input.quantidadeAtual}, ${input.quantidadeMinima})
  `
  revalidatePath("/estoque")
}

export async function ajustarEstoque(id: number, delta: number) {
  await ensureEstoqueTable()
  await sql`
    UPDATE estoque_itens
    SET quantidade_atual = GREATEST(0, quantidade_atual + ${delta}), atualizado_em = now()
    WHERE id = ${id}
  `
  revalidatePath("/estoque")
}

export async function removerItemEstoque(id: number) {
  await ensureEstoqueTable()
  await sql`DELETE FROM estoque_itens WHERE id = ${id}`
  revalidatePath("/estoque")
}
