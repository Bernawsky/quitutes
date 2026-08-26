import { notFound } from "next/navigation"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { FeedbackShell } from "@/components/feedback-shell"
import { FeedbackForm } from "@/components/feedback-form"

export const dynamic = "force-dynamic"

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminSupabaseClient()

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, pousada, unidades")
    .eq("feedback_token", token)
    .maybeSingle()

  if (!pedido) notFound()

  const { data: feedback } = await admin.from("feedbacks").select("id").eq("pedido_id", pedido.id).maybeSingle()
  const unidadesFixas = ((pedido.unidades as { unidade: string }[] | null) ?? []).map((u) => u.unidade)

  return (
    <FeedbackShell>
      <FeedbackForm
        token={token}
        pousadaNome={pedido.pousada ?? "Vale do Sol"}
        unidadesFixas={unidadesFixas}
        jaAvaliado={!!feedback}
      />
    </FeedbackShell>
  )
}
