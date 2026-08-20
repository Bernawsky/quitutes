import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getPedidoPorId } from "@/app/actions/pedidos"
import { descreverItens } from "@/lib/pedidos"
import { PrintTrigger } from "@/app/logistica/[id]/print-trigger"

export const dynamic = "force-dynamic"

export default async function LogisticaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pedido = await getPedidoPorId(Number(id))
  if (!pedido) notFound()

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const protocol = h.get("x-forwarded-proto") ?? "http"
  const feedbackUrl = `${protocol}://${host}/feedback/${pedido.id}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(feedbackUrl)}`

  const porHorario = new Map<string, typeof pedido.unidades>()
  for (const u of pedido.unidades) {
    const lista = porHorario.get(u.horario) ?? []
    lista.push(u)
    porHorario.set(u.horario, lista)
  }
  const horarios = Array.from(porHorario.keys()).sort()

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <PrintTrigger />

      <header className="mb-6 flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">Logística de Entrega — Cestas de Café da Manhã</h1>
          <p className="text-sm text-neutral-600">{pedido.saudacao}</p>
          <p className="text-xs text-neutral-500">
            Pedido #{pedido.id} · gerado em {new Date(pedido.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <img src={qrSrc || "/placeholder.svg"} alt="QR Code de feedback" className="size-24 shrink-0" />
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded border border-black p-2">
          <p className="text-lg font-bold">{pedido.total_unidades}</p>
          <p className="text-xs text-neutral-600">Quartos</p>
        </div>
        <div className="rounded border border-black p-2">
          <p className="text-lg font-bold">{pedido.total_pessoas}</p>
          <p className="text-xs text-neutral-600">Pessoas</p>
        </div>
        <div className="rounded border border-black p-2">
          <p className="text-lg font-bold">{pedido.total_itens}</p>
          <p className="text-xs text-neutral-600">Itens extras</p>
        </div>
      </div>

      {horarios.map((horario) => (
        <section key={horario} className="mb-5 break-inside-avoid">
          <h2 className="mb-2 border-b border-black text-lg font-semibold">Saída às {horario}hrs</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 pr-2">Pousada</th>
                <th className="py-1 pr-2">Quarto/Chalé</th>
                <th className="py-1 pr-2">Pessoas</th>
                <th className="py-1">Itens extras</th>
              </tr>
            </thead>
            <tbody>
              {(porHorario.get(horario) ?? []).map((u, idx) => (
                <tr key={`${u.pousadaId}-${idx}`} className="border-b border-neutral-300 align-top">
                  <td className="py-1.5 pr-2 font-medium">{u.pousada}</td>
                  <td className="py-1.5 pr-2">{u.quarto || "—"}</td>
                  <td className="py-1.5 pr-2">{u.pessoas}</td>
                  <td className="py-1.5">{descreverItens(u.itens).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="mt-8 border-t border-black pt-3 text-xs text-neutral-600">
        Todas as cestas e itens devem retornar à cafeteria após o recolhimento. Escaneie o QR Code acima para deixar
        um feedback rápido sobre esta entrega.
      </footer>
    </div>
  )
}
