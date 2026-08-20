import { NextResponse } from "next/server"
import { exportarMetricas } from "@/app/actions/metricas"

// Fechamento diário automático de métricas — substitui o webhook do N8N.
// Protegido por CRON_SECRET quando configurado (usado pelo Vercel Cron).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const resultado = await exportarMetricas("dia")
  return NextResponse.json({ ok: true, resultado })
}
