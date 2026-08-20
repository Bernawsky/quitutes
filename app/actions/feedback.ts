"use server"

import { sql } from "@/lib/db"
import type { Feedback } from "@/lib/feedback"
import { revalidatePath } from "next/cache"

async function ensureFeedbackTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      pedido_id BIGINT,
      nota INTEGER NOT NULL,
      comentario TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `
}

export async function enviarFeedback(input: { pedidoId: number; nota: number; comentario?: string }) {
  await ensureFeedbackTable()
  await sql`
    INSERT INTO feedbacks (pedido_id, nota, comentario)
    VALUES (${input.pedidoId}, ${input.nota}, ${input.comentario ?? null})
  `
  revalidatePath("/metricas")
}

export async function getFeedbacks(): Promise<Feedback[]> {
  await ensureFeedbackTable()
  const rows = await sql`
    SELECT id, pedido_id, nota, comentario, created_at
    FROM feedbacks
    ORDER BY created_at DESC
    LIMIT 50
  `
  return rows as Feedback[]
}
