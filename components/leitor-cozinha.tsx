"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  ChefHat,
  Clock,
  Building2,
  Users,
  Coffee,
  GlassWater,
  Sandwich,
  Cookie,
  CakeSlice,
  CalendarDays,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendario } from "@/components/calendario"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"
import { getPedidosPorData, getDatasComPedidosCesta } from "@/lib/pedidos-api"
import { HORARIOS, normalizarHorario, decomporCestas, somarCestas, rotuloData, amanhaISO, type ContagemCestas } from "@/lib/pedidos"

function rotuloCestas(c: ContagemCestas): string[] {
  const linhas: string[] = []
  if (c.individual > 0) linhas.push(`${c.individual} Individual${c.individual > 1 ? "is" : ""}`)
  if (c.dupla > 0) linhas.push(`${c.dupla} Dupla${c.dupla > 1 ? "s" : ""}`)
  if (c.tripla > 0) linhas.push(`${c.tripla} Tripla${c.tripla > 1 ? "s" : ""}`)
  return linhas
}

export function LeitorCozinha() {
  const [data, setData] = useState(amanhaISO())
  const { data: pedidos = [], isLoading } = useSWR(["leitor-pedidos", data], () => getPedidosPorData(data))
  const { data: datasComPedido = [] } = useSWR("leitor-datas-com-pedido", getDatasComPedidosCesta)

  const porHorario = useMemo(() => {
    const grupos = new Map<string, Map<string, ContagemCestas>>()
    for (const p of pedidos) {
      for (const u of p.unidades ?? []) {
        const h = normalizarHorario(u.horario)
        const pousada = p.pousada ?? "—"
        if (!grupos.has(h)) grupos.set(h, new Map())
        const porPousada = grupos.get(h)!
        porPousada.set(pousada, somarCestas(porPousada.get(pousada) ?? { individual: 0, dupla: 0, tripla: 0 }, decomporCestas(u.pessoas)))
      }
    }
    const ordem = [...grupos.keys()].sort((a, b) => {
      const idx = (v: string) => (HORARIOS as readonly string[]).indexOf(v)
      return (idx(a) === -1 ? 99 : idx(a)) - (idx(b) === -1 ? 99 : idx(b))
    })
    return ordem.map((h) => ({ horario: h, pousadas: [...grupos.get(h)!.entries()].sort((a, b) => a[0].localeCompare(b[0])) }))
  }, [pedidos])

  const totalDia = useMemo(() => {
    let pessoas = 0
    let cestas: ContagemCestas = { individual: 0, dupla: 0, tripla: 0 }
    for (const p of pedidos) {
      for (const u of p.unidades ?? []) {
        pessoas += u.pessoas || 0
        cestas = somarCestas(cestas, decomporCestas(u.pessoas))
      }
    }
    const fatias = cestas.individual * 2 + cestas.dupla * 3 + cestas.tripla * 4
    return { pessoas, fatias }
  }, [pedidos])

  const itens = [
    { icone: Coffee, nome: "Garrafinha de café", quantidade: totalDia.pessoas },
    { icone: GlassWater, nome: "Garrafinha de suco", quantidade: totalDia.pessoas },
    { icone: Sandwich, nome: "Queijo (fatias)", quantidade: totalDia.fatias },
    { icone: Sandwich, nome: "Presunto (fatias)", quantidade: totalDia.fatias },
    { icone: Cookie, nome: "Tortinhas", quantidade: totalDia.pessoas },
    { icone: CakeSlice, nome: "Cupcake", quantidade: totalDia.pessoas },
  ]

  return (
    <div className="min-h-svh bg-background pb-16 print:pb-0">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="size-5" aria-hidden="true" />
          </span>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Lista de preparo</h1>
            <p className="text-sm text-muted-foreground">O que precisa estar pronto para o café da manhã</p>
          </div>
          <AvisosBell />
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="tap gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {rotuloData(data)}
                </Button>
              }
            />
            <PopoverContent className="w-auto">
              <Calendario valor={data} onSelecionar={setData} datasComPedido={datasComPedido} />
            </PopoverContent>
          </Popover>
          <Button onClick={() => window.print()} className="tap gap-2">
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="print:hidden">
          <AvisoPushDesativado />
        </div>
        <p className="mb-4 hidden font-heading text-lg font-bold text-foreground print:block">
          Lista de preparo — {rotuloData(data)}
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : pedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <ChefHat className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum pedido para essa data</p>
            <p className="mt-1 text-sm text-muted-foreground">Escolha outra data no calendário acima.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-border bg-card p-5 print:border-none print:p-0 print:shadow-none">
              <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Quantidade de cestas</h2>
              <div className="flex flex-col gap-5">
                {porHorario.map(({ horario, pousadas }) => (
                  <div key={horario}>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <Clock className="size-4 text-primary" aria-hidden="true" />
                      {horario}
                    </p>
                    <div className="flex flex-col gap-2 border-l-2 border-primary/30 pl-3.5">
                      {pousadas.map(([pousada, cestas]) => (
                        <div key={pousada} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                            {pousada}
                          </span>
                          <span className="text-sm text-muted-foreground">{rotuloCestas(cestas).join(" • ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 print:border-none print:p-0 print:shadow-none">
              <h2 className="mb-4 flex items-center gap-1.5 font-heading text-base font-semibold text-card-foreground">
                Quantidade de itens (para preparar)
                <span className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  <Users className="size-3" aria-hidden="true" />
                  {totalDia.pessoas} pessoas
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {itens.map((it) => (
                  <li
                    key={it.nome}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2.5 print:border-none print:px-0 print:py-1"
                  >
                    <it.icone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1 text-sm text-foreground">{it.nome}</span>
                    <span className="text-sm font-bold text-foreground">{it.quantidade}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
