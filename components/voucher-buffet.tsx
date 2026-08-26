import { Users, UserRound, CalendarDays } from "lucide-react"
import { rotuloData } from "@/lib/pedidos"
import { LOGO_POUSADA, LOGO_QUITUTES } from "@/lib/logos-pousada"

export function VoucherBuffet({
  pousadaNome,
  pousadaSlug,
  pessoas,
  hospede,
  dataISO,
}: {
  pousadaNome: string
  pousadaSlug: string
  pessoas: number
  hospede: string
  dataISO: string
}) {
  const logoPousada = LOGO_POUSADA[pousadaSlug]

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-md">
      <div className="bg-[#173a68] px-5 py-4 text-center">
        <p className="font-heading text-lg font-extrabold tracking-wide text-white uppercase">Voucher Buffet</p>
      </div>

      <div className="flex items-center justify-center gap-3 bg-[#f0c94a] px-5 py-4">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-sm">
          <img src={LOGO_QUITUTES} alt="Quitutes" className="size-full object-contain" />
        </div>
        {logoPousada && (
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-sm">
            <img src={logoPousada} alt={pousadaNome} className="size-full object-contain" />
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-border bg-card px-6 py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div>
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Users className="size-3.5" aria-hidden="true" />
              Pessoas
            </p>
            <p className="font-heading text-lg font-bold text-card-foreground">{pessoas}</p>
          </div>

          <div>
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <UserRound className="size-3.5" aria-hidden="true" />
              Hóspede
            </p>
            <p className="font-heading text-lg font-bold text-balance text-card-foreground">{hospede}</p>
          </div>

          <div>
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Data
            </p>
            <p className="font-heading text-lg font-bold text-card-foreground">{rotuloData(dataISO)}</p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto mt-5 h-12 w-56"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 2px, transparent 2px, transparent 4px, #1a1a1a 4px, #1a1a1a 5px, transparent 5px, transparent 8px)",
            backgroundSize: "100% 100%",
          }}
        />
      </div>
    </div>
  )
}
