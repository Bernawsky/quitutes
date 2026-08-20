import { EstoquePainel } from "@/components/estoque-painel"
import { getEstoque } from "@/app/actions/estoque"

export const dynamic = "force-dynamic"

export default async function EstoquePage() {
  const itens = await getEstoque()
  return <EstoquePainel itensIniciais={itens} />
}
