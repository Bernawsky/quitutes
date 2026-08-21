import type { Ranking } from "@/lib/export-pedidos"

type DadosRelatorio = {
  rotuloPeriodo: string
  totalPedidos: number
  totalPessoas: number
  cancelados: number
  ranking: Ranking[]
  porPousada: { pousada: string; total: number }[]
  analiseHtml: string | null
}

function linhaTabela(rotulo: string, valor: string | number) {
  return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555">${rotulo}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;text-align:right">${valor}</td></tr>`
}

export function montarEmailRelatorio(dados: DadosRelatorio): string {
  const rankingLinhas = dados.ranking
    .map((r) => linhaTabela(r.unidade, r.total))
    .join("")
  const pousadasLinhas = dados.porPousada
    .map((p) => linhaTabela(p.pousada, p.total))
    .join("")

  return `
  <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#292524">
    <div style="background:#a16207;padding:24px 28px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">Fechamento de período — ${dados.rotuloPeriodo}</h1>
      <p style="color:#fde68a;margin:4px 0 0;font-size:13px">Quitutes — cestas de café da manhã</p>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:28px;border-radius:0 0 12px 12px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${linhaTabela("Total de pedidos", dados.totalPedidos)}
        ${linhaTabela("Pessoas atendidas", dados.totalPessoas)}
        ${linhaTabela("Cancelados", dados.cancelados)}
      </table>

      ${
        dados.analiseHtml
          ? `<h2 style="font-size:15px;color:#a16207;margin:0 0 8px">Análise</h2><div style="font-size:14px;line-height:1.6">${dados.analiseHtml}</div>`
          : ""
      }

      ${
        dados.porPousada.length > 0
          ? `<h2 style="font-size:15px;color:#a16207;margin:24px 0 8px">Pedidos por pousada</h2><table style="width:100%;border-collapse:collapse">${pousadasLinhas}</table>`
          : ""
      }

      ${
        dados.ranking.length > 0
          ? `<h2 style="font-size:15px;color:#a16207;margin:24px 0 8px">Ranking por unidade</h2><table style="width:100%;border-collapse:collapse">${rankingLinhas}</table>`
          : ""
      }

      <p style="font-size:12px;color:#999;margin-top:28px">Gerado automaticamente ao fechar o período no painel de métricas.</p>
    </div>
  </div>`
}
