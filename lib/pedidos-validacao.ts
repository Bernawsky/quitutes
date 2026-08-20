import { HORARIOS, contarItens, normalizarHorario, type UnidadePedido } from "@/lib/pedidos"

export type UnidadeValidada = Required<Pick<UnidadePedido, "unidade" | "horario" | "pessoas" | "itens">> &
  Pick<UnidadePedido, "dietas" | "observacao">

/**
 * Validação usada no backend (e reaproveitada no frontend).
 * Toda unidade precisa de nome, horário válido e pessoas >= 1.
 */
export function validarUnidades(unidades: unknown): UnidadeValidada[] {
  if (!Array.isArray(unidades) || unidades.length === 0) {
    throw new Error("Informe ao menos uma cesta no pedido.")
  }
  if (unidades.length > 50) throw new Error("Pedido com unidades demais.")

  return unidades.map((raw, i) => {
    const u = raw as Partial<UnidadePedido>
    const nome = String(u?.unidade ?? "").trim()
    if (!nome || nome.length > 60) throw new Error(`Unidade inválida na posição ${i + 1}.`)

    const horario = normalizarHorario(String(u?.horario ?? ""))
    if (!(HORARIOS as readonly string[]).includes(horario)) {
      throw new Error(`Selecione um horário válido para ${nome}.`)
    }

    const pessoas = Number(u?.pessoas ?? 0)
    if (!Number.isInteger(pessoas) || pessoas < 1 || pessoas > 50) {
      throw new Error(`Informe a quantidade de pessoas para ${nome}.`)
    }

    const itensBruto = (u?.itens ?? {}) as Record<string, unknown>
    const itens: Record<string, number> = {}
    for (const [k, v] of Object.entries(itensBruto)) {
      const qtd = Number(v)
      if (Number.isInteger(qtd) && qtd > 0 && qtd <= 99) itens[k] = qtd
    }

    const dietas = Array.isArray(u?.dietas) ? u.dietas.filter((d): d is string => typeof d === "string").slice(0, 4) : []

    const observacao = String(u?.observacao ?? "").trim().slice(0, 280)

    return { unidade: nome, horario, pessoas, itens, dietas, observacao }
  })
}

export function calcularTotais(unidades: UnidadeValidada[]) {
  return {
    total_unidades: unidades.length,
    total_itens: unidades.reduce((acc, u) => acc + contarItens(u.itens), 0),
    total_pessoas: unidades.reduce((acc, u) => acc + u.pessoas, 0),
  }
}
