import type { ReactNode } from "react"
import { Coffee } from "lucide-react"

export function FeedbackShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 32rem at 50% -10%, color-mix(in oklch, var(--accent) 22%, transparent), transparent 65%)",
        }}
      />
      <div className="animate-feedback-in relative w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Coffee className="size-6" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/15"
              />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-xl font-bold text-balance text-card-foreground">Dê seu feedback</h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Conte pra gente como foi a cesta de café da manhã.
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
