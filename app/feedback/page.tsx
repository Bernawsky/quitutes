import { FeedbackShell } from "@/components/feedback-shell"
import { FeedbackForm } from "@/components/feedback-form"

export const dynamic = "force-dynamic"

export default function FeedbackGenericoPage() {
  return (
    <FeedbackShell>
      <FeedbackForm jaAvaliado={false} />
    </FeedbackShell>
  )
}
