import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  agruparPorTipo,
  calcularBatidas,
  calcularIngredientes,
  calcularLatas,
  formatarDiaProducao,
  formatarPeso,
  RECEITAS,
  type DiaProducao,
} from "@/lib/producao"

function getY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30
}

function garantirEspaco(doc: jsPDF, y: number, minimo = 40): number {
  if (y > 297 - minimo) {
    doc.addPage()
    return 20
  }
  return y
}

function escreverGrupo(doc: jsPDF, y: number, grupo: { tipo: keyof typeof RECEITAS; pesoTotalG: number; itens: DiaProducao["itens"] }): number {
  y = garantirEspaco(doc, y)
  const batidas = calcularBatidas(grupo.pesoTotalG)
  const ingredientes = calcularIngredientes(grupo.tipo, batidas.pesoPorBatidaG)

  doc.setFontSize(11)
  doc.setTextColor(40)
  const titulo =
    batidas.numero > 1
      ? `${RECEITAS[grupo.tipo].nome} — Bater ${batidas.numero}x (${formatarPeso(batidas.pesoPorBatidaG)} por batida, ${formatarPeso(grupo.pesoTotalG)} no total)`
      : `${RECEITAS[grupo.tipo].nome} — ${formatarPeso(grupo.pesoTotalG)}`
  doc.text(titulo, 14, y + 6)

  autoTable(doc, {
    startY: y + 10,
    head: [["Ingrediente", "Quantidade"]],
    body: ingredientes.map((i) => [i.nome, formatarPeso(i.gramas)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [161, 98, 7] },
    margin: { left: 14, right: 105 },
    tableWidth: 90,
  })
  const yIngredientes = getY(doc)

  autoTable(doc, {
    startY: y + 10,
    head: [["Pão", "Unidades", "Latas"]],
    body: grupo.itens.map((item) => [item.sabor, String(item.unidades), String(calcularLatas(item))]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [161, 98, 7] },
    margin: { left: 110 },
  })
  const yPaes = getY(doc)

  return Math.max(yIngredientes, yPaes) + 6
}

/**
 * Gera o PDF de uma produção (rascunho atual ou uma produção concluída do histórico) — mesmo conteúdo
 * mostrado na tela, mas como download real em vez de impressão do navegador.
 */
export function exportarProducaoPDF(dias: DiaProducao[], opcoes?: { titulo?: string; baixarArquivo?: boolean }) {
  const doc = new jsPDF({ orientation: "portrait" })
  const titulo = opcoes?.titulo ?? "Planejamento de Produção"
  const baixarArquivo = opcoes?.baixarArquivo ?? true

  doc.setFontSize(16)
  doc.text(titulo, 14, 16)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 23)

  let y = 30
  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data))

  for (const dia of diasOrdenados) {
    y = garantirEspaco(doc, y, 20)
    doc.setFontSize(13)
    doc.setTextColor(20)
    doc.text(formatarDiaProducao(dia.data), 14, y)
    y += 4

    for (const grupo of agruparPorTipo(dia.itens)) {
      y = escreverGrupo(doc, y, grupo)
    }
  }

  const todosItens = diasOrdenados.flatMap((d) => d.itens)
  if (todosItens.length > 0) {
    y = garantirEspaco(doc, y, 20)
    doc.setFontSize(13)
    doc.setTextColor(20)
    doc.text("Total do período (todos os dias somados)", 14, y)
    y += 4
    for (const grupo of agruparPorTipo(todosItens)) {
      y = escreverGrupo(doc, y, grupo)
    }
  }

  const nomeArquivo = `producao-${new Date().toISOString().slice(0, 10)}.pdf`
  if (baixarArquivo) doc.save(nomeArquivo)
  const dataUri = doc.output("datauristring")
  return { nomeArquivo, base64: dataUri.slice(dataUri.indexOf(",") + 1) }
}
