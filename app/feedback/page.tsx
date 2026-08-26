import { MessageSquareHeart } from "lucide-react"
import { FeedbackForm } from "@/components/feedback-form"

export const dynamic = "force-dynamic"

export default function FeedbackGenericoPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessageSquareHeart className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-lg font-bold text-balance text-card-foreground">Dê seu feedback</h1>
          <p className="text-sm text-muted-foreground">Conte pra gente como foi a cesta de café da manhã.</p>
        </div>
        <FeedbackForm jaAvaliado={false} />
      </div>
    </div>
  )
}
