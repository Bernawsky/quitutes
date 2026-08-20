import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { normalizarHorario, observacoesUnidade, type Pedido } from "@/lib/pedidos"

function baixar(conteudo: BlobPart, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement("a")
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvCampo(v: string | number) {
  const s = String(v ?? "")
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function dataBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR")
}

export type Ranking = { unidade: string; total: number }

export function exportarPedidosCSV(pedidos: Pedido[], ranking: Ranking[], sufixo: string) {
  const linhas: string[] = []
  linhas.push("PEDIDOS")
  linhas.push(["ID", "Data", "Pousada", "Situação", "Unidade", "Horário", "Pessoas", "Observações"].map(csvCampo).join(";"))
  for (const p of pedidos) {
    for (const u of p.unidades ?? []) {
      linhas.push(
        [
          p.id,
          dataBR(p.created_at),
          p.pousada ?? "Vale do Sol",
          p.status === "cancelado" ? "Cancelado" : "Ativo",
          u.unidade,
          normalizarHorario(u.horario),
          u.pessoas,
          observacoesUnidade(u).join(", ").replace(/\*/g, ""),
        ]
          .map(csvCampo)
          .join(";"),
      )
    }
  }
  linhas.push("")
  linhas.push("RANKING POR UNIDADE")
  linhas.push(["Unidade", "Pedidos"].join(";"))
  for (const r of ranking) linhas.push([csvCampo(r.unidade), r.total].join(";"))

  baixar("﻿" + linhas.join("\n"), `pedidos-${sufixo}.csv`, "text/csv;charset=utf-8;")
}

export function exportarPedidosPDF(
  pedidos: Pedido[],
  ranking: Ranking[],
  sufixo: string,
  rotuloPeriodo: string,
  baixarArquivo = true,
) {
  const doc = new jsPDF({ orientation: "landscape" })
  doc.setFontSize(16)
  doc.text("Relatório de pedidos — Cestas de café da manhã", 14, 16)
  doc.setFontSize(10)
  doc.text(`Período: ${rotuloPeriodo} • Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 23)

  autoTable(doc, {
    startY: 30,
    head: [["ID", "Data", "Pousada", "Situação", "Unidade", "Horário", "Pessoas", "Observações"]],
    body: pedidos.flatMap((p) =>
      (p.unidades ?? []).map((u) => [
        String(p.id),
        dataBR(p.created_at),
        p.pousada ?? "Vale do Sol",
        p.status === "cancelado" ? "Cancelado" : "Ativo",
        u.unidade,
        normalizarHorario(u.horario),
        String(u.pessoas),
        observacoesUnidade(u).join(", ").replace(/\*/g, ""),
      ]),
    ),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [161, 98, 7] },
  })

  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30
  autoTable(doc, {
    startY: y + 10,
    head: [["Ranking por unidade", "Pedidos"]],
    body: ranking.map((r) => [r.unidade, String(r.total)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [161, 98, 7] },
  })

  const nomeArquivo = `pedidos-${sufixo}.pdf`
  if (baixarArquivo) doc.save(nomeArquivo)
  const dataUri = doc.output("datauristring")
  return { nomeArquivo, base64: dataUri.slice(dataUri.indexOf(",") + 1) }
}
