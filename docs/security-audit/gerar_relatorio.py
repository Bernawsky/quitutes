#!/usr/bin/env python3
"""
Gera o relatório de auditoria de segurança do projeto Quitutes em PDF.

Uso:
    .venv/bin/python3 gerar_relatorio.py

Regenerar depois de uma nova auditoria: edite a lista ACHADOS abaixo
(ou os textos de contexto) e rode de novo — o PDF é recriado do zero.
"""

import io
from datetime import datetime

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Paleta e constantes
# ---------------------------------------------------------------------------
COR_CRITICA = colors.HexColor("#B91C1C")
COR_ALTA = colors.HexColor("#EA580C")
COR_MEDIA = colors.HexColor("#D97706")
COR_BAIXA = colors.HexColor("#2563EB")
COR_PONTO_FORTE = colors.HexColor("#059669")
COR_INFORMATIVA = colors.HexColor("#6B7280")
COR_TEXTO = colors.HexColor("#1F2933")
COR_TEXTO_CLARO = colors.HexColor("#52606D")
COR_FUNDO_CAPA = colors.HexColor("#173A68")

SEVERIDADE_COR = {
    "Crítica": COR_CRITICA,
    "Alta": COR_ALTA,
    "Média": COR_MEDIA,
    "Baixa": COR_BAIXA,
    "Informativa": COR_INFORMATIVA,
}
ORDEM_SEVERIDADE = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]

NOME_PROJETO = "Quitutes"
DATA_RELATORIO = datetime.now().strftime("%d/%m/%Y")
ARQUIVO_SAIDA = "relatorio-auditoria-seguranca.pdf"

# ---------------------------------------------------------------------------
# Dados da auditoria
# ---------------------------------------------------------------------------

ESCOPO = (
    "Repositório completo <b>Bernawsky/quitutes</b> na branch <b>main</b>: todas as rotas de API "
    "(<font face='Courier'>app/api/**/route.ts</font>), todas as Server Actions "
    "(<font face='Courier'>app/actions/*.ts</font>), todas as páginas e layouts do App Router, "
    "as bibliotecas de acesso a dados (<font face='Courier'>lib/pedidos-api.ts</font>, "
    "<font face='Courier'>lib/pousadas-api.ts</font>), configuração de deploy "
    "(<font face='Courier'>vercel.json</font>), o serviço auxiliar "
    "<font face='Courier'>whatsapp-service/</font>, arquivos de ambiente/documentação "
    "(<font face='Courier'>.env.example</font>, <font face='Courier'>README.md</font>), o histórico "
    "completo do Git (58 commits) e — via acesso direto ao banco (Supabase MCP) — todas as políticas de "
    "Row Level Security e o código-fonte de todas as funções <font face='Courier'>SECURITY DEFINER</font> "
    "do projeto."
)

METODOLOGIA = [
    (
        "Stack detectada",
        "Next.js 16 (App Router, TypeScript) + Supabase (Postgres, Auth, Row Level Security) — sem ORM "
        "tradicional, o cliente <font face='Courier'>@supabase/supabase-js</font> fala direto com o banco. "
        "Frontend em React 19 com <font face='Courier'>@base-ui/react</font>. Deploy na Vercel, sem "
        "Docker, CI, Helm ou Terraform no repositório.",
    ),
    (
        "1. Banco sem tranca → RLS do Supabase",
        "O mecanismo de isolamento por inquilino/dono é inteiramente via Row Level Security do Postgres. "
        "Cada tabela foi inspecionada com <font face='Courier'>pg_policies</font> ao vivo no banco de "
        "produção, comparando a política com o que o código da aplicação assume.",
    ),
    (
        "2. Permissão no navegador → guards de servidor",
        "Como não há um middleware de autorização central, cada página/Server Action privilegiada precisa "
        "chamar explicitamente um guard (<font face='Courier'>exigirAdminServer()</font>, "
        "<font face='Courier'>exigirEquipeServer()</font> ou um <font face='Courier'>exigirAdmin()</font> "
        "local). Cada gate de UI foi cruzado com o guard correspondente do lado servidor.",
    ),
    (
        "3. IDOR → funções de acesso a dados por ID",
        "Sem rotas REST próprias de CRUD — as mutações saem do componente cliente direto pro Supabase. "
        "A auditoria percorreu toda função de <font face='Courier'>lib/pedidos-api.ts</font> e "
        "<font face='Courier'>lib/pousadas-api.ts</font> que recebe um ID, além das rotas customizadas em "
        "<font face='Courier'>app/api/</font> e da única rota dinâmica do projeto.",
    ),
    (
        "4. Chaves expostas → grep completo + histórico Git",
        "Varredura de padrões de segredo em todo o código-fonte, configs, o serviço "
        "<font face='Courier'>whatsapp-service/</font>, <font face='Courier'>.env.example</font>, "
        "<font face='Courier'>README.md</font> e nos 58 commits do histórico do Git.",
    ),
    (
        "5. Inputs sem tratamento → XSS",
        "Varredura por <font face='Courier'>dangerouslySetInnerHTML</font>, <font face='Courier'>innerHTML</font>, "
        "<font face='Courier'>eval</font>/<font face='Courier'>new Function</font>, hrefs controlados por "
        "usuário, e checagem de bibliotecas de sanitização instaladas vs. pontos onde HTML de usuário é "
        "de fato renderizado.",
    ),
]

# Cada achado: id, severidade, categoria, arquivo, linhas, titulo, descricao (lista de paragrafos),
# trecho de código, explorabilidade, recomendação
ACHADOS = [
    {
        "id": "A1",
        "severidade": "Crítica",
        "categoria": "2. Permissão definida no navegador",
        "arquivo": "app/actions/metricas.ts",
        "linhas": "15–26",
        "titulo": "Server Action de fechamento de período sem checagem de papel (role)",
        "descricao": [
            "A Server Action <font face='Courier'>fecharPeriodo()</font> é chamada pelo botão \"Exportar\" "
            "dentro da área administrativa (<font face='Courier'>components/exportar-dialog.tsx</font>), "
            "mas o único controle de acesso dentro da própria função é <font face='Courier'>if (!user) throw</font> "
            "— confere que existe uma sessão autenticada, mas nunca confere o papel (<font face='Courier'>role</font>) "
            "desse usuário.",
            "Isso contrasta diretamente com as funções irmãs do mesmo padrão de projeto — "
            "<font face='Courier'>convidarAdmin()</font> e <font face='Courier'>listarAdministradores()</font> "
            "(<font face='Courier'>app/actions/administracao.ts</font>) e "
            "<font face='Courier'>definirBuffetAtivo()</font> (<font face='Courier'>app/actions/buffet.ts</font>) "
            "— todas chamam um <font face='Courier'>exigirAdmin()</font> antes de executar. "
            "<font face='Courier'>fecharPeriodo()</font> ficou de fora desse padrão.",
            "Uma Server Action do Next.js é um endpoint HTTP próprio, alcançável diretamente por qualquer "
            "sessão autenticada independente de qual página React chamou a função — inclusive uma conta de "
            "pousada comum, que nunca deveria acessar nada em <font face='Courier'>/metricas</font>.",
        ],
        "codigo": (
            "export async function fecharPeriodo(input: {\n"
            "  periodo: string\n"
            "  rotuloPeriodo: string\n"
            "  totalPedidos: number\n"
            "  ranking: Ranking[]\n"
            "  pedidos: Pedido[]\n"
            "}) {\n"
            "  const supabase = await createServerSupabaseClient()\n"
            "  const { data: { user } } = await supabase.auth.getUser()\n"
            "  if (!user) throw new Error(\"Não autenticado.\")\n"
            "  // <- nunca confere se user.role === 'admin'\n"
            "  ...\n"
            "  const { error } = await supabase.from(\"metricas_exportadas\").insert({ ... })\n"
            "  const relatorio = await enviarRelatorioPorWhatsapp(input) // dispara WhatsApp pros admins"
        ),
        "explorabilidade": (
            "Qualquer conta de pousada autenticada pode chamar essa Server Action diretamente (o ID da "
            "ação é descoberto no bundle JS do cliente) com valores de <font face='Courier'>pedidos</font> "
            "e <font face='Courier'>ranking</font> forjados — a função nunca revalida esses dados contra o "
            "banco. O resultado: linhas falsas em <font face='Courier'>metricas_exportadas</font> e uma "
            "mensagem de WhatsApp forjada disparada para os números reais dos administradores.",
        ),
        "recomendacao": (
            "Adicionar o mesmo <font face='Courier'>exigirAdmin()</font> usado em "
            "<font face='Courier'>app/actions/administracao.ts</font> e "
            "<font face='Courier'>app/actions/buffet.ts</font> logo no início de "
            "<font face='Courier'>fecharPeriodo()</font>, e revalidar <font face='Courier'>pedidos</font>/"
            "<font face='Courier'>ranking</font> a partir do banco em vez de confiar no que o cliente envia."
        ),
    },
    {
        "id": "A2",
        "severidade": "Alta",
        "categoria": "Achado adicional — controle de acesso quebrado (dependente de ambiente)",
        "arquivo": "app/api/cron/fechar-metricas/route.ts, lembrete-pendencias/route.ts, relatorio-semanal/route.ts",
        "linhas": "8–14 / 7–11 / 7–11",
        "titulo": "Autenticação do cron vira opcional se a variável de ambiente não estiver setada",
        "descricao": [
            "As três rotas de cron job só validam o segredo se a variável de ambiente "
            "<font face='Courier'>CRON_SECRET</font> estiver definida — o padrão é "
            "<font face='Courier'>if (secret) { ... checa Authorization ... }</font>. Se essa variável "
            "não estiver configurada no projeto Vercel (esquecimento de configuração, novo ambiente de "
            "preview, etc.), o bloco inteiro de checagem é pulado e a rota fica completamente pública.",
        ],
        "codigo": (
            "const secret = process.env.CRON_SECRET\n"
            "if (secret) {\n"
            "  const auth = request.headers.get(\"authorization\")\n"
            "  if (auth !== `Bearer ${secret}`) {\n"
            "    return NextResponse.json({ error: \"unauthorized\" }, { status: 401 })\n"
            "  }\n"
            "}\n"
            "// se CRON_SECRET não existir, chega aqui sem nenhuma checagem"
        ),
        "explorabilidade": (
            "Depende de configuração de ambiente: só é explorável se <font face='Courier'>CRON_SECRET</font> "
            "não estiver setado na Vercel. Se estiver configurado (o que parece ser o caso hoje em "
            "produção, a julgar pelo <font face='Courier'>.env.example</font>), a rota está protegida. O "
            "risco é a ausência de uma falha segura (fail-closed): a configuração errada vira "
            "silenciosamente uma rota pública que dispara WhatsApp para os administradores e grava no "
            "banco via chave de serviço, sem nenhum aviso.",
        ),
        "recomendacao": (
            "Trocar para fail-closed: se <font face='Courier'>CRON_SECRET</font> não estiver definido, "
            "retornar 500/401 imediatamente em vez de pular a checagem — nunca permitir que a ausência da "
            "variável vire \"sem autenticação\"."
        ),
    },
    {
        "id": "A3",
        "severidade": "Média",
        "categoria": "3. IDOR (defesa em profundidade)",
        "arquivo": "lib/pedidos-api.ts",
        "linhas": "144–161 (editarPedidoPousada) e 164–178 (cancelarPedidoPousada)",
        "titulo": "Editar/cancelar pedido não reforça a posse da pousada na própria query",
        "descricao": [
            "Essas duas funções filtram a atualização só por "
            "<font face='Courier'>.eq(\"id\", input.id).eq(\"status\", \"ativo\")</font> — sem um "
            "<font face='Courier'>.eq(\"pousada_id\", ...)</font> explícito, diferente de "
            "<font face='Courier'>getMeusPedidos()</font> (linha 136), que tem esse filtro redundante "
            "além da RLS.",
            "A política de UPDATE da tabela <font face='Courier'>pedidos</font> foi inspecionada ao vivo "
            "no banco (via <font face='Courier'>pg_policies</font>) e confirma corretamente a posse "
            "(<font face='Courier'>EXISTS (... p.auth_user_id = auth.uid())</font>) — hoje a proteção real "
            "existe e está certa. O ponto é que o código da aplicação não tem uma segunda camada: se essa "
            "política de RLS um dia regredir (uma migration futura, um erro de revisão), essas duas "
            "funções passam a aceitar qualquer <font face='Courier'>id</font> de pedido — e os IDs são "
            "inteiros sequenciais, não UUID, portanto adivinháveis por enumeração simples.",
        ],
        "codigo": (
            "export async function cancelarPedidoPousada(input: { id: number; motivo?: string }) {\n"
            "  const { error } = await supabase\n"
            "    .from(\"pedidos\")\n"
            "    .update({ status: \"cancelado\", motivo_cancelamento: input.motivo ?? null, ... })\n"
            "    .eq(\"id\", input.id)\n"
            "    .eq(\"status\", \"ativo\")\n"
            "    // sem .eq(\"pousada_id\", ...) — depende 100% da RLS"
        ),
        "explorabilidade": (
            "Não explorável hoje (a política de RLS cobre corretamente o caso). É um achado de "
            "resiliência/defesa em profundidade, não uma vulnerabilidade ativa.",
        ),
        "recomendacao": (
            "Adicionar <font face='Courier'>.eq(\"pousada_id\", pousadaIdDaSessao)</font> nessas duas "
            "queries como camada extra, do mesmo jeito que já é feito em "
            "<font face='Courier'>getMeusPedidos()</font>."
        ),
    },
    {
        "id": "A4",
        "severidade": "Média",
        "categoria": "3. IDOR (defesa em profundidade)",
        "arquivo": "lib/pedidos-api.ts",
        "linhas": "salvarPedido (17–48) e salvarPedidoBuffet (51–78)",
        "titulo": "pousada_id do novo pedido vem do chamador, não é derivado da sessão",
        "descricao": [
            "As duas funções de criação de pedido recebem <font face='Courier'>pousadaId</font> como "
            "parâmetro comum vindo do componente React, em vez de o servidor derivar esse valor a partir "
            "da sessão autenticada. A política de INSERT da tabela (inspecionada ao vivo) já confere "
            "corretamente que o <font face='Courier'>pousada_id</font> enviado pertence ao usuário logado "
            "— então não é explorável hoje —, mas é o mesmo padrão de risco do achado A3: uma única linha "
            "de defesa, inteiramente na RLS.",
        ],
        "codigo": (
            "export async function salvarPedido(input: {\n"
            "  ...\n"
            "  pousadaId: string // vem do componente, não da sessão\n"
            "  pousada: string\n"
            "  dataPedido?: string\n"
            "}) { ... }"
        ),
        "explorabilidade": "Não explorável hoje — mitigado pela política de INSERT da RLS, já verificada.",
        "recomendacao": (
            "Considerar mover a resolução de <font face='Courier'>pousadaId</font> para o lado servidor "
            "(a partir da sessão), reduzindo a superfície de confiança no cliente."
        ),
    },
    {
        "id": "A5",
        "severidade": "Baixa",
        "categoria": "4. Chaves expostas (dado sensível, não é credencial)",
        "arquivo": "whatsapp-service/README.md",
        "linhas": "21",
        "titulo": "Número de WhatsApp real do negócio documentado em texto puro",
        "descricao": [
            "O README do serviço auxiliar de WhatsApp cita, como instrução de pareamento, o número real "
            "usado para rodar a automação (\"escaneie com o WhatsApp do número +55 32 98427-5356\"). Não é "
            "uma chave/segredo de autenticação, mas é uma informação operacional sensível documentada em "
            "um arquivo versionado no Git.",
        ],
        "codigo": '"escaneie com o WhatsApp do número +55 32 984275356"',
        "explorabilidade": (
            "Não é uma falha de acesso ao sistema — é exposição de PII/dado operacional que pode viabilizar "
            "engenharia social ou spam direcionado a esse número.",
        ),
        "recomendacao": "Substituir por um placeholder genérico na documentação (ex.: \"o número da conta configurada\").",
    },
    {
        "id": "A6",
        "severidade": "Informativa",
        "categoria": "4. Chaves expostas (hardening, não vulnerabilidade)",
        "arquivo": "Funções SECURITY DEFINER no banco: criar_pousada, redefinir_senha_pousada",
        "linhas": "—",
        "titulo": "Advisor do Supabase sinaliza RPCs SECURITY DEFINER chamáveis por qualquer authenticated",
        "descricao": [
            "O linter de segurança nativo do Supabase aponta que essas duas funções podem ser chamadas via "
            "<font face='Courier'>/rest/v1/rpc/...</font> por qualquer usuário autenticado, já que são "
            "<font face='Courier'>SECURITY DEFINER</font> e não têm <font face='Courier'>REVOKE EXECUTE</font> "
            "explícito.",
            "Ao ler o código-fonte real das funções direto no banco "
            "(<font face='Courier'>pg_proc.prosrc</font>), ambas começam com "
            "<font face='Courier'>IF NOT EXISTS (... role = 'admin') THEN RAISE EXCEPTION</font> — ou seja, "
            "chamar como não-admin apenas retorna erro. O alerta do advisor é, na prática, falso positivo.",
        ],
        "codigo": (
            "-- início de ambas as funções, confirmado via pg_proc.prosrc:\n"
            "IF NOT EXISTS (SELECT 1 FROM public.user_roles\n"
            "               WHERE user_id = auth.uid() AND role = 'admin'::app_role) THEN\n"
            "  RAISE EXCEPTION 'Acesso negado: apenas administradores.';\n"
            "END IF;"
        ),
        "explorabilidade": "Não explorável — check de admin interno já bloqueia não-admins.",
        "recomendacao": (
            "Hardening opcional: <font face='Courier'>REVOKE EXECUTE ... FROM authenticated</font> nessas "
            "funções, como segunda camada, para que o advisor pare de sinalizar e a superfície fique "
            "explicitamente fechada mesmo sem depender do check interno."
        ),
    },
    {
        "id": "A7",
        "severidade": "Informativa",
        "categoria": "5. Inputs sem tratamento (risco latente, não vulnerabilidade)",
        "arquivo": "package.json / todo o repositório",
        "linhas": "—",
        "titulo": "Nenhuma biblioteca de sanitização instalada",
        "descricao": [
            "Não há <font face='Courier'>dompurify</font>, <font face='Courier'>sanitize-html</font> ou "
            "equivalente nas dependências. Hoje isso não é um problema — a varredura completa do "
            "repositório encontrou só um uso de <font face='Courier'>dangerouslySetInnerHTML</font> "
            "(<font face='Courier'>components/ui/chart.tsx:95-109</font>), e ele injeta apenas variáveis "
            "CSS a partir de uma configuração estática de gráfico, nunca de dado de usuário. Todo texto de "
            "usuário (nome de pousada, saudação, comentário de feedback, motivo de cancelamento) passa por "
            "interpolação JSX comum, que o React escapa automaticamente.",
        ],
        "codigo": "grep -r \"dangerouslySetInnerHTML\\|innerHTML\\|eval(\\|new Function(\" app/ components/ lib/ hooks/\n# → 1 resultado, não relacionado a dado de usuário",
        "explorabilidade": "Sem vetor de XSS explorável hoje. Risco só se surgir uma futura renderização de HTML/markdown vindo de usuário sem essa lib.",
        "recomendacao": "Nenhuma ação imediata. Se algum dia for necessário renderizar HTML/markdown de usuário, instalar e usar uma lib de sanitização nesse ponto específico.",
    },
    {
        "id": "A8",
        "severidade": "Informativa",
        "categoria": "5. Inputs sem tratamento (teórico)",
        "arquivo": "lib/export-pedidos.ts",
        "linhas": "16–19 (csvCampo), 31–61",
        "titulo": "Exportação CSV não neutraliza caracteres de início de fórmula",
        "descricao": [
            "A função de escape do CSV (<font face='Courier'>csvCampo</font>) trata corretamente aspas, "
            "ponto-e-vírgula e quebras de linha, mas não prefixa campos que começam com "
            "<font face='Courier'>=</font>, <font face='Courier'>+</font>, <font face='Courier'>-</font> ou "
            "<font face='Courier'>@</font>. Se um nome de pousada ou observação começar com um desses "
            "caracteres e o CSV for aberto no Excel/Sheets, o programa pode interpretar o campo como fórmula "
            "(\"CSV injection\" clássico) — mas isso não afeta o sistema Quitutes em si, só quem abrir o "
            "arquivo exportado numa planilha.",
        ],
        "codigo": "function csvCampo(v: string) {\n  // escapa aspas/;/quebra de linha, mas não =/+/-/@\n  ...\n}",
        "explorabilidade": "Teórico, depende de um nome de pousada/comentário malicioso E de abrir o CSV numa planilha vulnerável a essa técnica.",
        "recomendacao": "Prefixar com apóstrofo (') campos que comecem com =, +, -, @ antes de escrever no CSV.",
    },
]

PONTOS_FORTES = [
    (
        "RLS granular e correta em todas as 11 tabelas",
        "Todas as políticas de Row Level Security foram lidas diretamente do banco em produção "
        "(<font face='Courier'>pg_policies</font>). O isolamento é feito por "
        "<font face='Courier'>pousadas.auth_user_id = auth.uid()</font> (pousadas) e por "
        "<font face='Courier'>user_roles.role</font> (admin/operador) — sem gaps encontrados.",
    ),
    (
        "Rotas de notificação nunca confiam no corpo da requisição",
        "<font face='Courier'>/api/notificar/cancelamento</font> e "
        "<font face='Courier'>/api/notificar/evento</font> sempre releem o pedido do banco através de um "
        "client com sessão do próprio usuário (respeitando RLS) antes de montar qualquer mensagem — "
        "corrige um padrão que, se copiado do corpo da requisição, seria uma falha clássica de forjar "
        "alertas.",
    ),
    (
        "Inscrição de push usa o ID de sessão do servidor, nunca do body",
        "<font face='Courier'>/api/push/subscribe</font> grava <font face='Courier'>user.id</font> obtido "
        "de <font face='Courier'>supabase.auth.getUser()</font>; <font face='Courier'>/api/push/unsubscribe</font> "
        "usa um client com RLS ativa, então só é possível apagar a própria inscrição.",
    ),
    (
        "Formulário público de feedback valida posse antes de gravar",
        "<font face='Courier'>/api/feedback</font> confere o formato do token (regex de UUID) e que a "
        "unidade selecionada pertence de fato ao pedido do token ou à pousada escolhida, antes do insert.",
    ),
    (
        "Token de feedback não é adivinhável",
        "<font face='Courier'>app/feedback/[token]/page.tsx</font> usa um token com formato UUID "
        "(~122 bits de entropia) — sem risco de enumeração para acessar o link de avaliação de outro "
        "pedido.",
    ),
    (
        "Toda página privilegiada chama seu guard de servidor",
        "<font face='Courier'>/administracao</font>, <font face='Courier'>/leitor</font>, "
        "<font face='Courier'>/vouchers</font> e todo o grupo <font face='Courier'>/metricas/*</font> "
        "(via layout) chamam <font face='Courier'>exigirAdminServer()</font>/"
        "<font face='Courier'>exigirEquipeServer()</font> — nenhuma rota protegida ficou sem guard.",
    ),
    (
        "Nenhum segredo real hardcoded em lugar nenhum",
        "Varredura completa do código-fonte, configs, <font face='Courier'>whatsapp-service/</font>, "
        "<font face='Courier'>.env.example</font>, <font face='Courier'>vercel.json</font> e nos 58 "
        "commits do histórico do Git — os únicos valores \"reais\" encontrados são a URL do projeto "
        "Supabase e a chave pública (<font face='Courier'>sb_publishable_...</font>), que são públicas por "
        "design.",
    ),
    (
        "Nenhum vetor de XSS explorável",
        "Todo texto vindo de usuário passa por escaping automático do JSX, por mensagens de WhatsApp em "
        "texto plano (sem interpretação de markup), ou por texto não-interpretado em PDF/CSV.",
    ),
]

RECOMENDACOES = [
    ("P1", "Adicionar checagem de papel (admin) em fecharPeriodo()", "app/actions/metricas.ts", "Achado A1 — crítico, corrige o gap mais sério encontrado."),
    ("P1", "Tornar a checagem do CRON_SECRET fail-closed", "app/api/cron/*/route.ts", "Achado A2 — evita que uma configuração ausente vire rota pública."),
    ("P2", "Reforçar posse (pousada_id) nas queries de edição/cancelamento", "lib/pedidos-api.ts", "Achado A3 — defesa em profundidade além da RLS já correta."),
    ("P2", "Derivar pousada_id da sessão em vez do parâmetro do cliente", "lib/pedidos-api.ts", "Achado A4 — mesma linha de raciocínio do A3."),
    ("P3", "Remover o número de WhatsApp real da documentação", "whatsapp-service/README.md", "Achado A5 — reduz exposição de PII em texto versionado."),
    ("P3", "Revogar EXECUTE das RPCs para authenticated, além do check interno", "Banco (Postgres)", "Achado A6 — hardening, já protegido pela checagem interna."),
    ("P3", "Escapar caracteres de fórmula na exportação CSV", "lib/export-pedidos.ts", "Achado A8 — proteção teórica contra CSV injection no Excel/Sheets."),
]

# ---------------------------------------------------------------------------
# Gráficos (matplotlib -> PNG em memória)
# ---------------------------------------------------------------------------

def grafico_rosca_severidade():
    contagem = {s: 0 for s in ORDEM_SEVERIDADE}
    for a in ACHADOS:
        contagem[a["severidade"]] += 1
    labels = [s for s in ORDEM_SEVERIDADE if contagem[s] > 0]
    valores = [contagem[s] for s in labels]
    cores = [SEVERIDADE_COR[s].hexval()[2:] for s in labels]
    cores_hex = ["#" + c for c in cores]

    fig, ax = plt.subplots(figsize=(4.4, 4.4), dpi=200)
    wedges, _ = ax.pie(
        valores,
        colors=cores_hex,
        startangle=90,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
    )
    ax.text(0, 0.08, str(len(ACHADOS)), ha="center", va="center", fontsize=26, fontweight="bold", color="#1F2933")
    ax.text(0, -0.2, "achados", ha="center", va="center", fontsize=11, color="#52606D")
    ax.legend(
        wedges,
        [f"{s} ({contagem[s]})" for s in labels],
        loc="upper center",
        bbox_to_anchor=(0.5, -0.02),
        ncol=2,
        frameon=False,
        fontsize=9.5,
    )
    ax.set_aspect("equal")
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def grafico_barras_categoria():
    categorias_ordem = [
        "1. Banco sem tranca",
        "2. Permissão definida no navegador",
        "3. IDOR",
        "4. Chaves expostas",
        "5. Inputs sem tratamento (XSS)",
        "Achado adicional",
    ]

    def bucket(cat: str) -> str:
        if cat.startswith("2."):
            return "2. Permissão definida no navegador"
        if cat.startswith("3."):
            return "3. IDOR"
        if cat.startswith("4."):
            return "4. Chaves expostas"
        if cat.startswith("5."):
            return "5. Inputs sem tratamento (XSS)"
        if cat.startswith("1."):
            return "1. Banco sem tranca"
        return "Achado adicional"

    contagem = {c: 0 for c in categorias_ordem}
    cor_predominante = {c: COR_INFORMATIVA for c in categorias_ordem}
    ordem_sev_idx = {s: i for i, s in enumerate(ORDEM_SEVERIDADE)}
    pior_sev = {c: 99 for c in categorias_ordem}

    for a in ACHADOS:
        b = bucket(a["categoria"])
        contagem[b] += 1
        idx = ordem_sev_idx[a["severidade"]]
        if idx < pior_sev[b]:
            pior_sev[b] = idx
            cor_predominante[b] = SEVERIDADE_COR[a["severidade"]]

    labels = [c for c in categorias_ordem if contagem[c] > 0]
    valores = [contagem[c] for c in labels]
    cores = [cor_predominante[c] for c in labels]
    cores_hex = [c.hexval() if hasattr(c, "hexval") else c for c in cores]
    cores_hex = [("#" + h[2:]) if h.startswith("0x") else h for h in cores_hex]

    fig, ax = plt.subplots(figsize=(6.6, 3.6), dpi=200)
    y_pos = range(len(labels))
    ax.barh(y_pos, valores, color=cores_hex, height=0.55)
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(labels, fontsize=9.5, color="#1F2933")
    ax.invert_yaxis()
    ax.set_xlabel("Nº de achados", fontsize=9.5, color="#52606D")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="x", labelsize=9)
    ax.set_xticks(range(0, max(valores) + 2))
    for i, v in enumerate(valores):
        ax.text(v + 0.06, i, str(v), va="center", fontsize=9.5, color="#1F2933")
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
estilos = getSampleStyleSheet()
estilos.add(ParagraphStyle("TituloCapa", fontName="Helvetica-Bold", fontSize=26, textColor=colors.white, leading=32))
estilos.add(ParagraphStyle("SubtituloCapa", fontName="Helvetica", fontSize=13, textColor=colors.HexColor("#CBD5E1"), leading=18, spaceBefore=10))
estilos.add(ParagraphStyle("MetaCapa", fontName="Helvetica", fontSize=10.5, textColor=colors.HexColor("#94A3B8"), leading=15))
estilos.add(ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=17, textColor=COR_TEXTO, spaceBefore=4, spaceAfter=10))
estilos.add(ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=13, textColor=COR_TEXTO, spaceBefore=14, spaceAfter=6))
estilos.add(ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=11, textColor=COR_TEXTO, spaceBefore=4, spaceAfter=4))
estilos.add(ParagraphStyle("Corpo", fontName="Helvetica", fontSize=9.6, textColor=COR_TEXTO, leading=14, alignment=TA_JUSTIFY, spaceAfter=6))
estilos.add(ParagraphStyle("CorpoPequeno", fontName="Helvetica", fontSize=8.8, textColor=COR_TEXTO_CLARO, leading=12.5, spaceAfter=4))
estilos.add(ParagraphStyle("Meta", fontName="Helvetica-Oblique", fontSize=8.6, textColor=COR_TEXTO_CLARO, leading=12, spaceAfter=6))
estilos.add(ParagraphStyle("Codigo", fontName="Courier", fontSize=7.6, textColor=colors.HexColor("#0F172A"), leading=10.5, backColor=colors.HexColor("#F1F5F9")))
estilos.add(ParagraphStyle("Rotulo", fontName="Helvetica-Bold", fontSize=9, textColor=COR_TEXTO))


def envolver_markdown(texto: str, largura: int = 96) -> str:
    """Quebra linhas longas de prosa/checklist em um bloco Markdown para caber no PDF em
    fonte monoespaçada, preservando trechos ```code``` (não mexe neles) e usando indentação
    de continuação (hanging indent) para listas — GitHub ainda renderiza normal, já que uma
    quebra de linha sem linha em branco só continua o mesmo parágrafo/item."""
    import textwrap

    linhas_saida = []
    dentro_de_codigo = False
    for linha in texto.split("\n"):
        if linha.strip().startswith("```"):
            dentro_de_codigo = not dentro_de_codigo
            linhas_saida.append(linha)
            continue
        if dentro_de_codigo or len(linha) <= largura:
            linhas_saida.append(linha)
            continue

        prefixo = ""
        resto = linha
        for marcador in ("- [ ] ", "- ", "1. ", "2. ", "3. ", "## ", "# "):
            if linha.startswith(marcador):
                prefixo = marcador
                resto = linha[len(marcador):]
                break
        else:
            despojada = linha.lstrip(" ")
            indent = len(linha) - len(despojada)
            if indent > 0:
                prefixo = linha[:indent]
                resto = despojada

        quebradas = textwrap.wrap(
            resto,
            width=max(largura - len(prefixo), 20),
            break_long_words=False,
            break_on_hyphens=False,
        ) or [""]
        indent_continuacao = " " * len(prefixo)
        linhas_saida.append(prefixo + quebradas[0])
        for extra in quebradas[1:]:
            linhas_saida.append(indent_continuacao + extra)

    return "\n".join(linhas_saida)


def chip(texto, cor):
    return Table(
        [[Paragraph(f"<font color='white'><b>{texto}</b></font>", ParagraphStyle("chip", fontName="Helvetica-Bold", fontSize=8, textColor=colors.white, alignment=1))]],
        colWidths=[2.6 * cm],
        rowHeights=[0.52 * cm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), cor),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ]),
    )


# ---------------------------------------------------------------------------
# Cabeçalho / rodapé
# ---------------------------------------------------------------------------

def desenhar_moldura(canvas, doc):
    canvas.saveState()
    largura, altura = A4
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COR_TEXTO_CLARO)
        canvas.drawString(2 * cm, altura - 1.35 * cm, f"Relatório de Auditoria de Segurança — {NOME_PROJETO}")
        canvas.drawRightString(largura - 2 * cm, altura - 1.35 * cm, DATA_RELATORIO)
        canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas.line(2 * cm, altura - 1.5 * cm, largura - 2 * cm, altura - 1.5 * cm)
        canvas.line(2 * cm, 1.5 * cm, largura - 2 * cm, 1.5 * cm)
        canvas.drawCentredString(largura / 2, 1.05 * cm, f"Página {doc.page - 1}")
    canvas.restoreState()


def desenhar_capa(canvas, doc):
    canvas.saveState()
    largura, altura = A4
    canvas.setFillColor(COR_FUNDO_CAPA)
    canvas.rect(0, 0, largura, altura, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#F0C94A"))
    canvas.rect(0, altura - 0.55 * cm, largura, 0.55 * cm, fill=1, stroke=0)
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Montagem do documento
# ---------------------------------------------------------------------------

def construir_pdf(caminho_saida: str):
    doc = BaseDocTemplate(
        caminho_saida,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Relatório de Auditoria de Segurança — {NOME_PROJETO}",
        author="Auditoria automatizada",
    )

    frame_capa = Frame(2 * cm, 2 * cm, A4[0] - 4 * cm, A4[1] - 4 * cm, id="capa")
    frame_conteudo = Frame(2 * cm, 1.9 * cm, A4[0] - 4 * cm, A4[1] - 3.9 * cm, id="conteudo")

    doc.addPageTemplates([
        PageTemplate(id="Capa", frames=[frame_capa], onPage=desenhar_capa),
        PageTemplate(id="Conteudo", frames=[frame_conteudo], onPage=desenhar_moldura),
    ])

    story = []

    # ---------------- Capa ----------------
    story.append(Spacer(1, 5.5 * cm))
    story.append(Paragraph("Relatório de Auditoria<br/>de Segurança", estilos["TituloCapa"]))
    story.append(Paragraph(f"Projeto {NOME_PROJETO}", estilos["SubtituloCapa"]))
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph(f"Data: {DATA_RELATORIO}", estilos["MetaCapa"]))
    story.append(Paragraph("Repositório: Bernawsky/quitutes (branch main)", estilos["MetaCapa"]))
    story.append(Paragraph(f"Total de achados: {len(ACHADOS)} · Pontos fortes verificados: {len(PONTOS_FORTES)}", estilos["MetaCapa"]))
    story.append(NextPageTemplate("Conteudo"))
    story.append(PageBreak())

    # ---------------- Escopo e metodologia ----------------
    story.append(Paragraph("Escopo auditado", estilos["H1"]))
    story.append(Paragraph(ESCOPO, estilos["Corpo"]))
    story.append(Paragraph("Nota metodológica — mapeamento das categorias para a stack", estilos["H2"]))
    for titulo, texto in METODOLOGIA:
        story.append(Paragraph(titulo, estilos["H3"]))
        story.append(Paragraph(texto, estilos["Corpo"]))
    story.append(PageBreak())

    # ---------------- Resumo executivo ----------------
    story.append(Paragraph("Resumo executivo", estilos["H1"]))
    contagem_sev = {s: sum(1 for a in ACHADOS if a["severidade"] == s) for s in ORDEM_SEVERIDADE}
    linhas_resumo = "".join(
        f"<font color='{SEVERIDADE_COR[s].hexval()[2:] and '#' + SEVERIDADE_COR[s].hexval()[2:]}'>●</font> "
        f"{s}: <b>{contagem_sev[s]}</b>&nbsp;&nbsp;&nbsp;"
        for s in ORDEM_SEVERIDADE if contagem_sev[s] > 0
    )
    story.append(Paragraph(linhas_resumo, estilos["Corpo"]))
    story.append(Spacer(1, 0.3 * cm))

    img_rosca = grafico_rosca_severidade()
    img_barras = grafico_barras_categoria()
    from reportlab.platypus import Image as RLImage

    tabela_graficos = Table(
        [[RLImage(img_rosca, width=7.0 * cm, height=7.0 * cm), RLImage(img_barras, width=9.0 * cm, height=5.0 * cm)]],
        colWidths=[7.4 * cm, 9.2 * cm],
    )
    tabela_graficos.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(tabela_graficos)
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(
        "O achado crítico (A1) e o de severidade alta (A2) concentram o risco real do sistema hoje: uma "
        "checagem de papel ausente numa Server Action, e uma checagem de segredo que vira opcional se a "
        "variável de ambiente não estiver configurada. Os demais achados são de defesa em profundidade ou "
        "informativos — não representam falhas exploráveis nas condições atuais de configuração.",
        estilos["Corpo"],
    ))
    story.append(PageBreak())

    # ---------------- Pontos fortes ----------------
    story.append(Paragraph("Pontos fortes (evidência de cobertura da auditoria)", estilos["H1"]))
    for titulo, texto in PONTOS_FORTES:
        linha = Table(
            [[Paragraph("✓", ParagraphStyle("check", fontName="Helvetica-Bold", fontSize=12, textColor=COR_PONTO_FORTE)),
              Paragraph(f"<b>{titulo}</b><br/>{texto}", estilos["CorpoPequeno"])]],
            colWidths=[0.8 * cm, 15.4 * cm],
        )
        linha.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(linha)
        story.append(Spacer(1, 0.18 * cm))
    story.append(PageBreak())

    # ---------------- Pontos fracos / tabela resumo ----------------
    story.append(Paragraph("Pontos fracos — tabela resumo dos achados", estilos["H1"]))
    dados_tabela = [["Severidade", "Arquivo:linha", "Descrição"]]
    estilos_linha = []
    for a in ACHADOS:
        dados_tabela.append([
            a["severidade"],
            Paragraph(f"<font face='Courier' size=7.6>{a['arquivo'].split(',')[0].strip()}:{a['linhas'].split('(')[0].strip()}</font>", estilos["CorpoPequeno"]),
            Paragraph(f"<b>[{a['id']}]</b> {a['titulo']}", estilos["CorpoPequeno"]),
        ])
    tabela = Table(dados_tabela, colWidths=[2.6 * cm, 5.0 * cm, 8.8 * cm], repeatRows=1)
    estilo_tabela = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2933")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ]
    for i, a in enumerate(ACHADOS, start=1):
        estilo_tabela.append(("TEXTCOLOR", (0, i), (0, i), SEVERIDADE_COR[a["severidade"]]))
        estilo_tabela.append(("FONTNAME", (0, i), (0, i), "Helvetica-Bold"))
        estilo_tabela.append(("FONTSIZE", (0, i), (0, i), 8.4))
    tabela.setStyle(TableStyle(estilo_tabela))
    story.append(tabela)
    story.append(PageBreak())

    # ---------------- Achados detalhados ----------------
    story.append(Paragraph("Achados detalhados", estilos["H1"]))
    for a in ACHADOS:
        bloco = []
        cabecalho = Table(
            [[chip(a["severidade"], SEVERIDADE_COR[a["severidade"]]),
              Paragraph(f"<b>[{a['id']}]</b> {a['titulo']}", estilos["H3"])]],
            colWidths=[2.9 * cm, 12.5 * cm],
        )
        cabecalho.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        bloco.append(cabecalho)
        bloco.append(Spacer(1, 0.15 * cm))
        bloco.append(Paragraph(f"<b>Categoria:</b> {a['categoria']}", estilos["Meta"]))
        bloco.append(Paragraph(f"<b>Arquivo:</b> <font face='Courier'>{a['arquivo']}</font> — linhas {a['linhas']}", estilos["Meta"]))
        for p in a["descricao"]:
            bloco.append(Paragraph(p, estilos["Corpo"]))
        bloco.append(Paragraph("Trecho de código", estilos["Rotulo"]))
        bloco.append(Preformatted(a["codigo"], estilos["Codigo"]))
        bloco.append(Spacer(1, 0.1 * cm))
        explor = a["explorabilidade"]
        if isinstance(explor, tuple):
            explor = explor[0]
        bloco.append(Paragraph(f"<b>Explorabilidade:</b> {explor}", estilos["CorpoPequeno"]))
        recom = a["recomendacao"]
        bloco.append(Paragraph(f"<b>Recomendação:</b> {recom}", estilos["CorpoPequeno"]))
        story.append(KeepTogether(bloco))
        story.append(Spacer(1, 0.5 * cm))

    story.append(PageBreak())

    # ---------------- Recomendações priorizadas ----------------
    story.append(Paragraph("Recomendações priorizadas", estilos["H1"]))
    dados_rec = [["Prioridade", "Recomendação", "Onde", "Referência"]]
    for p, titulo, onde, ref in RECOMENDACOES:
        dados_rec.append([p, Paragraph(titulo, estilos["CorpoPequeno"]), Paragraph(f"<font face='Courier' size=7.6>{onde}</font>", estilos["CorpoPequeno"]), Paragraph(ref, estilos["CorpoPequeno"])])
    tabela_rec = Table(dados_rec, colWidths=[2.0 * cm, 6.4 * cm, 4.4 * cm, 3.6 * cm], repeatRows=1)
    cor_prioridade = {"P1": COR_CRITICA, "P2": COR_ALTA, "P3": COR_BAIXA}
    estilo_rec = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2933")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i, (p, *_r) in enumerate(RECOMENDACOES, start=1):
        estilo_rec.append(("TEXTCOLOR", (0, i), (0, i), cor_prioridade[p]))
        estilo_rec.append(("FONTNAME", (0, i), (0, i), "Helvetica-Bold"))
    tabela_rec.setStyle(TableStyle(estilo_rec))
    story.append(tabela_rec)
    story.append(PageBreak())

    # ---------------- Issues para o GitHub ----------------
    story.append(Paragraph("Issues para o GitHub", estilos["H1"]))
    story.append(Paragraph(
        "Texto pronto em Markdown para copiar e colar diretamente na criação de uma issue no GitHub. "
        "Achados triviais relacionados foram agrupados numa única issue para não gerar spam.",
        estilos["Corpo"],
    ))

    issues_md = [
        (
            1,
            "[Segurança] Server Action de fechamento de período sem checagem de papel (admin)",
            ["security", "crítica"],
            """## Problema

A Server Action `fecharPeriodo()` em `app/actions/metricas.ts` (linhas 15-26) só confere se existe uma
sessão autenticada (`if (!user) throw`), mas nunca confere se o usuário tem o papel `admin`. Isso é
inconsistente com o resto do projeto: `convidarAdmin()` / `listarAdministradores()`
(`app/actions/administracao.ts`) e `definirBuffetAtivo()` (`app/actions/buffet.ts`) chamam um
`exigirAdmin()` antes de executar qualquer coisa privilegiada.

Server Actions do Next.js são endpoints HTTP próprios e alcançáveis diretamente por qualquer sessão
autenticada, independente de qual página React chamou a função.

## Evidência

`app/actions/metricas.ts:15-26`
```ts
export async function fecharPeriodo(input: {
  periodo: string
  rotuloPeriodo: string
  totalPedidos: number
  ranking: Ranking[]
  pedidos: Pedido[]
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")
  // nunca confere user.role === 'admin'
  ...
}
```

## Impacto

Qualquer conta de pousada autenticada pode chamar essa Server Action diretamente com `pedidos`/`ranking`
forjados, gravando linhas falsas em `metricas_exportadas` e disparando uma mensagem de WhatsApp forjada
para os números reais dos administradores.

## Sugestão de correção

Adicionar a mesma checagem `exigirAdmin()` usada em `app/actions/administracao.ts` e
`app/actions/buffet.ts` logo no início de `fecharPeriodo()`, e revalidar `pedidos`/`ranking` a partir do
banco em vez de confiar no que o cliente envia.

## Critérios de aceite

- [ ] `fecharPeriodo()` chama um guard equivalente a `exigirAdmin()` antes de qualquer efeito colateral
- [ ] Chamar a action autenticado como uma conta de pousada (não-admin) retorna erro e não grava nada
- [ ] `pedidos`/`ranking` usados no relatório são revalidados/buscados do banco, não confiam cegamente no payload do cliente
""",
        ),
        (
            2,
            "[Segurança] Checagem do CRON_SECRET vira opcional se a variável não estiver configurada",
            ["security", "alta"],
            """## Problema

As três rotas de cron (`app/api/cron/fechar-metricas/route.ts`, `lembrete-pendencias/route.ts`,
`relatorio-semanal/route.ts`) só validam o header `Authorization` se `process.env.CRON_SECRET` estiver
definido: `if (secret) { ... }`. Se a variável não estiver configurada no ambiente (esquecimento, novo
ambiente de preview, etc.), a checagem inteira é pulada e a rota fica pública.

## Evidência

`app/api/cron/fechar-metricas/route.ts:8-14` (mesmo padrão nas outras duas rotas)
```ts
const secret = process.env.CRON_SECRET
if (secret) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
}
// se CRON_SECRET não existir, chega aqui sem checagem nenhuma
```

## Impacto

Numa configuração sem `CRON_SECRET`, qualquer pessoa na internet pode chamar essas rotas, disparando
mensagens de WhatsApp para os números reais dos administradores e escrevendo em `metricas_exportadas`
via client de service-role.

## Sugestão de correção

Trocar para fail-closed: se `CRON_SECRET` não estiver definido, retornar erro (401/500) imediatamente,
nunca deixar a ausência da variável significar "sem autenticação".

## Critérios de aceite

- [ ] As 3 rotas de cron retornam erro se `CRON_SECRET` não estiver definido no ambiente
- [ ] Uma chamada sem header `Authorization` correto retorna 401 em qualquer ambiente
- [ ] Documentar em `.env.example`/README que `CRON_SECRET` é obrigatório em produção
""",
        ),
        (
            3,
            "[Segurança] Reforçar defesa em profundidade em edição/criação de pedidos (IDOR)",
            ["security", "média"],
            """## Problema

Duas questões relacionadas de defesa em profundidade em `lib/pedidos-api.ts`, ambas mitigadas hoje pela
RLS (já verificada e correta), mas sem uma segunda camada no código da aplicação:

1. `editarPedidoPousada` (linhas 144-161) e `cancelarPedidoPousada` (linhas 164-178) filtram só por
   `.eq("id", input.id).eq("status", "ativo")`, sem `.eq("pousada_id", ...)` — diferente de
   `getMeusPedidos` (linha 136), que tem esse filtro redundante.
2. `salvarPedido`/`salvarPedidoBuffet` recebem `pousadaId` como parâmetro do chamador em vez de derivá-lo
   da sessão no servidor.

IDs de pedido são inteiros sequenciais (não UUID), portanto enumeráveis.

## Evidência

`lib/pedidos-api.ts:144-161`
```ts
export async function editarPedidoPousada(input: { id: number; ... }) {
  const { error } = await supabase
    .from("pedidos")
    .update({ ... })
    .eq("id", input.id)
    .eq("status", "ativo")
    // sem .eq("pousada_id", ...)
}
```

## Impacto

Nenhum hoje — a política de RLS de UPDATE/INSERT em `pedidos` já confere corretamente a posse via
`pousadas.auth_user_id = auth.uid()`. Isto é puramente uma questão de resiliência: se a RLS um dia
regredir, essas funções passam a aceitar qualquer `id`/`pousadaId`.

## Sugestão de correção

Adicionar `.eq("pousada_id", pousadaIdDaSessao)` em `editarPedidoPousada`/`cancelarPedidoPousada`, e
considerar derivar `pousadaId` a partir da sessão em vez de aceitá-lo como parâmetro em
`salvarPedido`/`salvarPedidoBuffet`.

## Critérios de aceite

- [ ] `editarPedidoPousada` e `cancelarPedidoPousada` incluem filtro explícito por `pousada_id`
- [ ] Testado manualmente: uma pousada não consegue editar/cancelar pedido de outra mesmo manipulando o `id` via console
""",
        ),
        (
            4,
            "[Segurança] Hardening: PII em documentação, RPCs sem REVOKE explícito e CSV injection teórico",
            ["security", "baixa", "informativa"],
            """## Problema

Três itens de hardening de baixa severidade, agrupados por não serem vulnerabilidades ativas:

1. **PII em documentação** — `whatsapp-service/README.md:21` expõe o número de WhatsApp real do negócio
   em texto puro.
2. **RPCs sem REVOKE explícito** — `criar_pousada` e `redefinir_senha_pousada` (SECURITY DEFINER) são
   sinalizadas pelo advisor de segurança do Supabase como chamáveis por qualquer `authenticated`. O
   código-fonte das duas já confirma um `IF NOT EXISTS (...role='admin') THEN RAISE EXCEPTION` no início —
   não são exploráveis — mas não há `REVOKE EXECUTE` explícito como segunda camada.
3. **CSV injection teórico** — `lib/export-pedidos.ts` (`csvCampo`, linhas 16-19) escapa aspas/`;`/quebras
   de linha, mas não neutraliza campos que começam com `=`, `+`, `-` ou `@`, o que pode virar uma fórmula
   ao abrir o CSV no Excel/Sheets.

## Sugestão de correção

- Substituir o número real no README por um placeholder genérico.
- Rodar `REVOKE EXECUTE ON FUNCTION criar_pousada, redefinir_senha_pousada FROM authenticated;` no banco.
- Prefixar com apóstrofo (`'`) campos do CSV que comecem com `=`, `+`, `-` ou `@`.

## Critérios de aceite

- [ ] README não expõe mais o número de WhatsApp real
- [ ] `REVOKE EXECUTE` aplicado nas duas RPCs (advisor do Supabase para de sinalizar)
- [ ] `csvCampo` neutraliza caracteres de início de fórmula
""",
        ),
    ]

    for numero, titulo, labels, corpo_md in issues_md:
        story.append(Paragraph(f"Issue {numero} de {len(issues_md)}", estilos["H2"]))
        texto_completo = f"--- ISSUE {numero} ---\n\n# {titulo}\n\n**Labels sugeridas:** {', '.join(labels)}\n\n{corpo_md}\n--- FIM ISSUE {numero} ---"
        story.append(Preformatted(envolver_markdown(texto_completo), estilos["Codigo"]))
        story.append(Spacer(1, 0.4 * cm))

    doc.build(story)


if __name__ == "__main__":
    construir_pdf(ARQUIVO_SAIDA)
    print(f"PDF gerado: {ARQUIVO_SAIDA}")
