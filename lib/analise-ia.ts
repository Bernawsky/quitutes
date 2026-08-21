import type { Ranking } from "@/lib/export-pedidos"

type DadosPeriodo = {
  rotuloPeriodo: string
  totalPedidos: number
  totalPessoas: number
  cancelados: number
  ranking: Ranking[]
  porPousada: { pousada: string; total: number }[]
}

/**
 * Gera uma análise executiva do período fechado via API da Anthropic. Requer
 * ANTHROPIC_API_KEY configurada; sem ela, retorna null e a mensagem sai sem a
 * seção de análise, em vez de quebrar o fechamento do período.
 */
export async function gerarAnaliseIA(dados: DadosPeriodo): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = `Você é o analista de dados da Quitutes, sistema de pedidos de cestas de café da manhã para pousadas em Ibitipoca (MG).

Gere um feedback executivo em português sobre o fechamento do período "${dados.rotuloPeriodo}", para ser lido pelos fundadores da empresa. Seja específico e baseie-se SOMENTE nos números abaixo — nunca invente dados que não foram fornecidos.

Dados do período:
- Total de pedidos: ${dados.totalPedidos}
- Total de pessoas atendidas: ${dados.totalPessoas}
- Pedidos cancelados: ${dados.cancelados}
- Ranking por unidade (unidade, total de pedidos): ${JSON.stringify(dados.ranking)}
- Pedidos por pousada: ${JSON.stringify(dados.porPousada)}

Estrutura da resposta:
1. Um resumo curto (1-2 frases) do desempenho do período.
2. Os destaques e possíveis riscos que os números sugerem (ex: concentração em poucas pousadas, taxa de cancelamento, unidades mais/menos pedidas).
3. De 2 a 3 recomendações práticas e acionáveis.

Retorne APENAS texto simples pronto para uma mensagem de WhatsApp: use *asteriscos* para negrito e "- " para itens de lista, sem markdown (sem #, sem **), sem títulos HTML, não invente números fora dos dados fornecidos.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { content?: { text?: string }[] }
    const texto = data.content?.[0]?.text
    return typeof texto === "string" && texto.trim() ? texto : null
  } catch {
    return null
  }
}
