import { notFound } from "next/navigation"
import { ShoppingBasket } from "lucide-react"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { rotuloData } from "@/lib/pedidos"
import { FeedbackForm } from "@/components/feedback-form"

export const dynamic = "force-dynamic"

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminSupabaseClient()

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, pousada, data_pedido")
    .eq("feedback_token", token)
    .maybeSingle()

  if (!pedido) notFound()

  const { data: feedback } = await admin.from("feedbacks").select("id").eq("pedido_id", pedido.id).maybeSingle()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBasket className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-lg font-bold text-balance text-card-foreground">Como foi sua cesta?</h1>
          <p className="text-sm text-muted-foreground">
            {pedido.pousada ?? "Vale do Sol"} • café de {rotuloData(pedido.data_pedido)}
          </p>
        </div>
        <FeedbackForm token={token} jaAvaliado={!!feedback} />
      </div>
    </div>
  )
}
