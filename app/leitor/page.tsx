import type { Metadata } from "next"
import { exigirEquipeServer } from "@/lib/supabase/server"
import { LeitorCozinha } from "@/components/leitor-cozinha"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Lista de Preparo — Cozinha",
  description: "O que precisa ser preparado para o café da manhã do dia seguinte.",
}

export default async function LeitorPage() {
  await exigirEquipeServer()

  return <LeitorCozinha />
}
