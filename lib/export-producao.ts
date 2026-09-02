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
  type TipoMassa,
} from "@/lib/producao"

/** Paleta aproximada de app/globals.css (--primary, --accent, --border) convertida pra RGB, já que o jsPDF não lê oklch/CSS vars. */
const PRIMARY: [number, number, number] = [138, 90, 63]
const PRIMARY_LIGHT: [number, number, number] = [242, 235, 229]
const ACCENT: [number, number, number] = [232, 195, 107]
const ACCENT_LIGHT: [number, number, number] = [252, 247, 234]
const BORDER: [number, number, number] = [225, 219, 210]
const TEXT_DARK: [number, number, number] = [51, 43, 38]
const TEXT_MUTED: [number, number, number] = [140, 128, 116]

const PAGE_WIDTH = 210
const MARGIN = 14
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

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

/** Badge/pill com fundo preenchido atrás do texto — mesmo efeito visual das badges da tela. */
function desenharBadge(doc: jsPDF, texto: string, x: number, y: number, cor: [number, number, number], corTexto: [number, number, number]) {
  doc.setFontSize(9)
  const largura = doc.getTextWidth(texto) + 5
  doc.setFillColor(...cor)
  doc.roundedRect(x, y - 4.2, largura, 5.6, 1.2, 1.2, "F")
  doc.setTextColor(...corTexto)
  doc.text(texto, x + 2.5, y)
  return largura
}

type Grupo = { tipo: TipoMassa; pesoTotalG: number; itens: DiaProducao["itens"] }

/** Desenha um grupo de massa (título + badge de peso + tabelas), com moldura ao redor imitando o card da tela. */
function escreverGrupo(doc: jsPDF, y: number, grupo: Grupo, mostrarBatida: boolean): number {
  const batidas = calcularBatidas(grupo.pesoTotalG)
  const linhasIngredientes = calcularIngredientes(grupo.tipo, grupo.pesoTotalG).length
  const temBanner = mostrarBatida && batidas.numero > 1
  // Estima a altura do grupo pra reservar o espaço inteiro de uma vez — evita que a tabela ou a
  // moldura fiquem cortadas ao meio por uma quebra de página automática do autoTable.
  const alturaEstimada =
    16 + (temBanner ? 11 : 0) + Math.max(linhasIngredientes, grupo.itens.length) * 6 + 12
  y = garantirEspaco(doc, y, alturaEstimada)
  const inicioY = y
  const pesoParaIngredientes = mostrarBatida ? batidas.pesoPorBatidaG : grupo.pesoTotalG
  const ingredientes = calcularIngredientes(grupo.tipo, pesoParaIngredientes)

  let cursorY = y + 6
  doc.setFontSize(11.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...PRIMARY)
  doc.text(RECEITAS[grupo.tipo].nome, MARGIN + 2, cursorY)
  doc.setFont("helvetica", "normal")

  const larguraTitulo = doc.getTextWidth(RECEITAS[grupo.tipo].nome)
  desenharBadge(doc, `${formatarPeso(grupo.pesoTotalG)} de massa`, MARGIN + 2 + larguraTitulo + 4, cursorY, PRIMARY_LIGHT, PRIMARY)
  cursorY += 3

  if (mostrarBatida && batidas.numero > 1) {
    cursorY += 4
    const textoBatida = `Bater ${batidas.numero}x na amassadeira · ${formatarPeso(batidas.pesoPorBatidaG)} por batida`
    doc.setFillColor(...ACCENT_LIGHT)
    doc.setDrawColor(...ACCENT)
    doc.setLineWidth(0.2)
    doc.roundedRect(MARGIN + 2, cursorY - 4, CONTENT_WIDTH - 4, 6.5, 1.5, 1.5, "FD")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT_DARK)
    doc.text(textoBatida, MARGIN + 5, cursorY)
    doc.setFont("helvetica", "normal")
    cursorY += 5
  }

  autoTable(doc, {
    startY: cursorY + 3,
    head: [["Ingrediente", "Quantidade"]],
    body: ingredientes.map((i) => [i.nome, formatarPeso(i.gramas)]),
    styles: { fontSize: 9, textColor: TEXT_DARK, lineColor: BORDER, lineWidth: 0.1 },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    margin: { left: MARGIN + 2, right: PAGE_WIDTH - MARGIN - 96 },
    tableWidth: 92,
  })
  const yIngredientes = getY(doc)

  autoTable(doc, {
    startY: cursorY + 3,
    head: [["Pão", "Unidades", "Latas"]],
    body: grupo.itens.map((item) => [item.sabor, String(item.unidades), String(calcularLatas(item))]),
    styles: { fontSize: 9, textColor: TEXT_DARK, lineColor: BORDER, lineWidth: 0.1 },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    margin: { left: MARGIN + 98 },
  })
  const yPaes = getY(doc)

  const fimY = Math.max(yIngredientes, yPaes) + 3
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.25)
  doc.roundedRect(MARGIN, inicioY - 3, CONTENT_WIDTH, fimY - inicioY + 3, 2, 2, "S")

  return fimY + 5
}

/**
 * Gera o PDF de uma produção (rascunho atual ou uma produção concluída do histórico) — mesmo conteúdo
 * mostrado na tela, com o mesmo visual (cores da marca, badges, cards), como download real em vez de
 * impressão do navegador.
 */
export function exportarProducaoPDF(dias: DiaProducao[], opcoes?: { titulo?: string; baixarArquivo?: boolean }) {
  const doc = new jsPDF({ orientation: "portrait" })
  const titulo = opcoes?.titulo ?? "Planejamento de Produção"
  const baixarArquivo = opcoes?.baixarArquivo ?? true

  doc.setFontSize(17)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...PRIMARY)
  doc.text(titulo, MARGIN, 17)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...TEXT_MUTED)
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, MARGIN, 23.5)
  doc.setDrawColor(...ACCENT)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, 26.5, PAGE_WIDTH - MARGIN, 26.5)

  let y = 33
  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data))

  for (const dia of diasOrdenados) {
    y = garantirEspaco(doc, y, 20)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT_DARK)
    doc.text(formatarDiaProducao(dia.data), MARGIN, y)
    doc.setFont("helvetica", "normal")
    y += 4

    for (const grupo of agruparPorTipo(dia.itens)) {
      y = escreverGrupo(doc, y, grupo, true)
    }
  }

  const todosItens = diasOrdenados.flatMap((d) => d.itens)
  if (diasOrdenados.length > 1 && todosItens.length > 0) {
    y = garantirEspaco(doc, y, 20)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT_DARK)
    doc.text("Total do período (todos os dias somados)", MARGIN, y)
    doc.setFont("helvetica", "normal")
    y += 4
    // Sem nota de "Bater Nx" aqui — é só a soma pra lista de compras, cada dia já foi batido separadamente.
    for (const grupo of agruparPorTipo(todosItens)) {
      y = escreverGrupo(doc, y, grupo, false)
    }
  }

  const nomeArquivo = `producao-${new Date().toISOString().slice(0, 10)}.pdf`
  if (baixarArquivo) doc.save(nomeArquivo)
  const dataUri = doc.output("datauristring")
  return { nomeArquivo, base64: dataUri.slice(dataUri.indexOf(",") + 1) }
}
