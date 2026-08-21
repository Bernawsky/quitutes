import type { Ranking } from "@/lib/export-pedidos"

type DadosRelatorio = {
  rotuloPeriodo: string
  totalPedidos: number
  totalPessoas: number
  cancelados: number
  ranking: Ranking[]
  porPousada: { pousada: string; total: number }[]
  analiseTexto: string | null
}

export function montarMensagemRelatorio(dados: DadosRelatorio): string {
  const linhas: string[] = []
  linhas.push(`*Fechamento de período — ${dados.rotuloPeriodo}*`)
  linhas.push("_Quitutes — cestas de café da manhã_")
  linhas.push("")
  linhas.push(`Total de pedidos: *${dados.totalPedidos}*`)
  linhas.push(`Pessoas atendidas: *${dados.totalPessoas}*`)
  linhas.push(`Cancelados: *${dados.cancelados}*`)

  if (dados.analiseTexto) {
    linhas.push("")
    linhas.push("*Análise*")
    linhas.push(dados.analiseTexto.trim())
  }

  if (dados.porPousada.length > 0) {
    linhas.push("")
    linhas.push("*Pedidos por pousada*")
    for (const p of dados.porPousada) linhas.push(`- ${p.pousada}: ${p.total}`)
  }

  if (dados.ranking.length > 0) {
    linhas.push("")
    linhas.push("*Ranking por unidade*")
    for (const r of dados.ranking) linhas.push(`- ${r.unidade}: ${r.total}`)
  }

  return linhas.join("\n")
}
