import { FeedbackForm } from "@/app/feedback/[id]/feedback-form"

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 font-heading text-xl font-bold text-card-foreground">Como foi a sua cesta de café?</h1>
      <p className="mb-6 text-sm text-muted-foreground">Seu feedback ajuda o Quitutes a melhorar as próximas entregas.</p>
      <FeedbackForm pedidoId={Number(id)} />
    </div>
  )
}
