"use client"

import { useMemo, useState } from "react"
import type { Unidade } from "@/components/unidade-card"
import type { Pousada } from "@/lib/pousadas"
import type { UnidadePedido } from "@/lib/pedidos"

function unidadeVazia(u: { nome: string; isSuite?: boolean }, id: number): Unidade {
  return {
    id,
    nome: u.nome,
    ...(u.isSuite ? { isSuite: true } : {}),
    horario: "",
    pessoas: 0,
    itens: {} as Record<string, number>,
    dietas: [] as string[],
    observacao: "",
  }
}

/** Monta a lista completa de unidades da pousada, preenchendo com os dados já existentes (edição) quando houver. */
function criarUnidades(pousada: Pousada, existentes?: UnidadePedido[]): Unidade[] {
  const porNome = new Map((existentes ?? []).map((u) => [u.unidade, u]))
  return pousada.unidades.map((u, i) => {
    const base = unidadeVazia(u, i + 1)
    const existente = porNome.get(u.nome)
    if (!existente) return base
    return {
      ...base,
      horario: existente.horario,
      pessoas: existente.pessoas,
      itens: existente.itens ?? {},
      dietas: existente.dietas ?? [],
      observacao: existente.observacao ?? "",
    }
  })
}

/**
 * Pousadas com um único horário disponível têm o horário fixo: só é gravado no
 * estado da unidade quando ela passa a ter algo preenchido (evita que todas as
 * unidades apareçam como "ativas" só porque o horário já vem definido).
 */
function comHorarioFixo(pousada: Pousada, u: Unidade): string {
  return pousada.horarios.length === 1 && !u.horario ? pousada.horarios[0]! : u.horario
}

/** Estado + validação do formulário de cestas (compartilhado entre novo pedido, edição e agendamento). */
export function useUnidadesPedido(pousada: Pousada, seed?: UnidadePedido[]) {
  const [unidades, setUnidades] = useState<Unidade[]>(() => criarUnidades(pousada, seed))

  const handleHorario = (id: number, horario: string) => setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario } : u)))

  const handlePessoas = (id: number, pessoas: number) =>
    setUnidades((prev) =>
      prev.map((u) => (u.id === id ? { ...u, pessoas, horario: pessoas > 0 ? comHorarioFixo(pousada, u) : u.horario } : u)),
    )

  const handleItem = (id: number, key: string, qtd: number) =>
    setUnidades((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const itens = { ...u.itens }
        if (qtd > 0) itens[key] = qtd
        else delete itens[key]
        return { ...u, itens, horario: qtd > 0 ? comHorarioFixo(pousada, u) : u.horario }
      }),
    )

  const handleDieta = (id: number, key: string, ativo: boolean) =>
    setUnidades((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const dietas = ativo ? Array.from(new Set([...(u.dietas ?? []), key])) : (u.dietas ?? []).filter((d) => d !== key)
        return { ...u, dietas, horario: ativo ? comHorarioFixo(pousada, u) : u.horario }
      }),
    )

  const handleObservacao = (id: number, texto: string) =>
    setUnidades((prev) =>
      prev.map((u) => (u.id === id ? { ...u, observacao: texto, horario: texto.trim() ? comHorarioFixo(pousada, u) : u.horario } : u)),
    )

  const handleLimpar = (id: number) =>
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, horario: "", pessoas: 0, itens: {}, dietas: [], observacao: "" } : u)))

  const handleLimparTudo = () => setUnidades(criarUnidades(pousada))

  const unidadesAtivas = useMemo(
    () =>
      unidades.filter(
        (u) => u.horario || u.pessoas > 0 || Object.values(u.itens).some((q) => q > 0) || (u.dietas?.length ?? 0) > 0 || u.observacao?.trim(),
      ),
    [unidades],
  )

  const unidadesInvalidas = useMemo(() => unidadesAtivas.filter((u) => !u.horario || !(u.pessoas > 0)), [unidadesAtivas])

  const payload: UnidadePedido[] = useMemo(
    () =>
      unidadesAtivas.map((u) => ({
        unidade: u.nome,
        horario: u.horario,
        pessoas: u.pessoas,
        itens: u.itens,
        dietas: u.dietas ?? [],
        observacao: u.observacao?.trim() ?? "",
      })),
    [unidadesAtivas],
  )

  const podeEnviar = unidadesAtivas.length > 0 && unidadesInvalidas.length === 0

  return {
    unidades,
    setUnidades,
    handleHorario,
    handlePessoas,
    handleItem,
    handleDieta,
    handleObservacao,
    handleLimpar,
    handleLimparTudo,
    unidadesAtivas,
    unidadesInvalidas,
    payload,
    podeEnviar,
  }
}
