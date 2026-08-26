# Quitutes — Raio-X do Sistema

Documento gerado a partir de tudo que foi construído nas sessões de desenvolvimento: cada parte do sistema, nomeada e explicada. Serve como referência rápida do que existe e por quê.

---

## 1. Visão geral da stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Componentes de UI primitivos | `@base-ui/react` (Popover, Dialog, Select, Switch) — não é Radix |
| Banco de dados / Auth | Supabase (Postgres + Auth + Realtime + RLS) |
| Gráficos | Recharts |
| Notificações in-app | Sonner (toasts) |
| PDF/CSV | jsPDF + jspdf-autotable |
| Cache/dados no cliente | SWR |
| Análise por IA | Anthropic API (relatório semanal) |
| Hospedagem | Vercel (deploy automático a cada push em `main`) |
| Analytics | Vercel Analytics |

---

## 2. Segurança

- **RLS (Row Level Security) em toda tabela sensível** — a segurança real não está no front-end, está no Postgres. Cada política do banco decide o que cada papel pode ler/escrever, então mesmo bypassando a UI ninguém acessa dado de outra pousada.
- **Três papéis de acesso**: `admin` (dashboard completo), `operador` (equipe interna — Cozinha e Cafeteria, sem acesso a métricas/administração) e pousada (só os próprios pedidos).
- **Contas sem e-mail real**: pousadas e equipe autenticam com e-mail sintético (`slug@pousadas.quitutes.internal`, `cozinha@equipe.quitutes.internal`) + senha, via Supabase Auth — sem depender de e-mail de verdade.
- **Middleware de sessão** (`middleware.ts`) — renova o cookie de sessão do Supabase em toda requisição, senão Server Components perderiam o usuário logado no meio da navegação.
- **Guardas de servidor** (`lib/supabase/server.ts`):
  - `exigirAdminServer()` — bloqueia `/metricas` e `/administracao` pra quem não é admin (checado no servidor, não só escondendo botão na tela).
  - `exigirEquipeServer()` — libera `/leitor` e `/vouchers` pra admin **e** operador.
- **Rotas de API validam a sessão, nunca confiam no corpo da requisição**:
  - `/api/notificar/cancelamento` e `/api/notificar/evento` — a mensagem é sempre remontada a partir do banco (dado que a própria sessão tem permissão de ler via RLS), nunca do texto que o cliente mandou. Correção de uma falha real: antes, qualquer pessoa sem login podia forjar um alerta de cancelamento.
  - `/api/push/subscribe` e `/api/push/unsubscribe` — só o dono da sessão grava/apaga a própria inscrição de push.
- **Cron jobs protegidos por segredo** (`CRON_SECRET`) — `/api/cron/fechar-metricas`, `/api/cron/lembrete-pendencias`, `/api/cron/relatorio-semanal` exigem `Authorization: Bearer <segredo>`, senão qualquer um na internet poderia disparar os relatórios.
- **Chave de serviço isolada** (`lib/supabase/admin.ts`, `SUPABASE_SERVICE_ROLE_KEY`) — usada só em rotas de servidor que precisam ignorar RLS de propósito (ex: enviar push pra todos os admins), nunca exposta ao navegador.
- **Contas de administração fixas e nominais** (`Bernardo Campos`, `Quitutes da Beth`), não um cadastro público — reduz superfície de ataque.
- **Voucher/feedback com token não-adivinhável** (`feedback_token`) — o link público de avaliação não expõe ID sequencial.
- **VAPID (push)**: chave privada nunca sai do servidor; só a pública trafega pro navegador.

---

## 3. Velocidade / performance

- **Turbopack** no dev e no build — compilação incremental rápida.
- **SWR com cache compartilhado por chave** — telas diferentes que pedem os mesmos dados (ex: "meus pedidos" em `ReservasApp` e `MeusPedidos`) reaproveitam a mesma requisição em vez de duplicar.
- **Supabase Realtime** (`useRealtimePedidos`, canal de `eventos`) — invalida o cache automaticamente quando algo muda no banco, sem precisar de polling.
- **Notificação push em paralelo**: `/api/notificar/evento` registra o evento no banco e dispara o push **ao mesmo tempo** (`Promise.all`), não em sequência — a notificação chega mais rápido no celular de admins/equipe.
- **Rotas estáticas onde dá** — páginas institucionais das pousadas (`/villa-manso`, `/cabana-alpina`, etc.) são pré-renderizadas (`○ Static`); só o que depende de sessão/dado ao vivo é dinâmico (`ƒ`).
- **Imagens otimizadas** — logos em `.webp`, ícones em tamanhos certos (32×32, 180×180, 192×192, 512×512) em vez de um arquivo genérico grande sendo redimensionado no navegador.
- **Fetch mínimo por tela** — cada hook (`useDadosMetricas`, `use-unidades-pedido`, etc.) busca só o que a tela precisa, com filtros aplicados no cliente sobre um cache já carregado, evitando ida ao banco a cada clique de filtro.

---

## 4. Interatividade

- **Calendário com sinalização visual de pedidos** (`components/calendario.tsx`): dia com pedido já realizado fica verde clarinho, dia com pedido futuro fica amarelo clarinho, feriado/fim de semana ganha um aro azul clarinho — tudo isso somado ao dia selecionado e ao "hoje", sem um substituir o outro.
- **Mapa de calor mensal de cestas** (`components/calendario-heatmap.tsx`) — cor mais forte = mais cestas naquele dia; clicar num dia abre um **popup com a prévia dos pedidos** daquele dia (cesta ou Buffet, com pousada, quantidade e status de cancelamento).
- **Abas com pílula deslizante** — em Métricas (`MetricasShell`) e no portal da pousada (`ReservasApp`), a seleção de aba é uma pílula que desliza suavemente até a aba clicada (posição/largura calculadas de verdade no DOM), com scroll automático até a aba ativa em telas estreitas.
- **Sino de Avisos em tempo real** (`components/avisos-bell.tsx`) — lista ao vivo (Supabase Realtime) de novo pedido, edição, cancelamento e voucher de Buffet, com contador de não lidos.
- **Notificações push do navegador** (Chrome, Edge, Firefox, Safari desktop e iOS/iPadOS 16.4+ quando instalado na tela de início) — admins e equipe recebem aviso mesmo com o app fechado.
- **Aviso de notificação desativada, contextual por aba**: aparece com auto-fechamento em 1 minuto na Visão Geral, fica fixo (sem opção de fechar) em Pedidos, e não aparece em Histórico/Feedbacks/Buffet — e some para sempre depois de dispensado uma vez.
- **Prévia ao vivo da mensagem** — o texto que seria mandado é sempre montado e mostrado na tela conforme a pessoa preenche o pedido (mesmo com o envio automático pro WhatsApp temporariamente desligado).
- **Feedback tátil/visual em toda ação**: toasts de sucesso/erro (Sonner), estados de carregando, botões desabilitados durante o envio.
- **Animações de entrada em lista** (`components/ao-entrar.tsx`) — itens aparecem com uma leve transição em vez de "piscar" na tela.

---

## 5. UI (interface)

- **Design system próprio, não é um template genérico**: paleta terrosa/quente (marrom, bege, amarelo), tipografia `Poppins` (títulos) + `Inter` (texto), tudo via tokens CSS (`--primary`, `--accent`, `--muted`, etc.) — trocar o tema é mudar variáveis, não caçar cor em cada componente.
- **Paleta de status consistente em todo o sistema**: amarelo clarinho = pendência/futuro (nunca vermelho, que fica reservado pra erro/cancelamento real), verde clarinho = já aconteceu, azul clarinho = feriado/fim de semana.
- **Componentes de UI próprios sobre `@base-ui/react`**: `Button`, `Select`, `Popover`, `Dialog`, `Switch` — sem widgets nativos do navegador (que ficam feios e inconsistentes entre Chrome/Safari/Firefox).
- **Ícones consistentes** via `lucide-react` em todo o sistema (nunca emoji ou mistura de bibliotecas de ícone).
- **Cartões de estatística (`StatCard`), badges de status (Cancelado/Buffet/Cesta), listas com ícone+texto** seguem o mesmo padrão visual em Métricas, Histórico e Leitor.
- **Voucher de Buffet com identidade visual própria**, replicando o design de referência: cabeçalho azul-escuro, faixa amarela com logo do Quitutes + logo da pousada, divisor tracejado, código de barras decorativo.
- **Favicon adaptado a tema claro/escuro** (`icon-light-32x32.png` / `icon-dark-32x32.png`) e imagem de compartilhamento (Open Graph) com a logo oficial da marca.
- **Ícone de app real no iPhone/Android**: manifest (`manifest.webmanifest`) com ícones 192px/512px — antes disso, "adicionar à tela de início" virava um atalho qualquer, não um ícone de app de verdade.

---

## 6. UX (experiência de uso)

- **Fluxo por papel, sem menu confuso**: cada tipo de conta (pousada, Cozinha, Cafeteria, admin) cai direto na tela que importa pra ela depois do login — ninguém navega por telas que não usa.
- **Responsivo de verdade, não só "não quebra"**: barra de abas rola sozinha em telas estreitas (iPhone X pra cima) em vez de forçar quebra de linha e empurrar outros botões; folha modal (`Dialog`) sobe do rodapé no celular e vira modal centralizado no desktop.
- **Menos cliques pra tarefa mais comum**: "Café para" já sugere a data de amanhã, calendário já mostra onde a pousada tem pedido marcado, formulário de Buffet já bloqueia dias que não são feriado/fim de semana.
- **Mensagens de erro específicas, não genéricas** — cada `toast.error` explica o que faltou ("Informe horário e pessoas em: Quartzo Rosa") em vez de "algo deu errado".
- **Nunca perde contexto ao trocar de aba**: filtros de período e pousada ficam salvos na própria URL (`useFiltrosMetricas`), então voltar/avançar no navegador ou compartilhar o link mantém o filtro aplicado.
- **Avisos que sabem quando parar de incomodar**: o aviso de "pousadas sem pedido" e o de "notificação desativada" têm regras próprias de quando aparecer, por quanto tempo, e se dá pra fechar — calibrados por tela, não um comportamento único jogado em todo canto.
- **Transparência sobre o que foi pedido**: qualquer pedido (cesta ou Buffet) aparece com o mesmo nível de detalhe nos históricos, com selo visual de qual é qual — nunca escondido ou misturado.
- **Impressão pensada como tela própria**: `/leitor` tem um layout específico pra impressão (esconde cabeçalho e ações, mantém só o conteúdo), não é a tela normal jogada numa folha.

---

## 7. Funcionalidades por área

### 7.1 Pousadas (portal de pedidos)
- Login por usuário/senha (sem e-mail real).
- Montar pedido por quarto/chalé: horário, quantidade de pessoas, itens extras, restrição alimentar, observação.
- Prévia da mensagem em tempo real.
- "Meus pedidos": editar ou cancelar (com motivo) o que já foi enviado.
- Feedback dos hóspedes (formulário público, com ou sem token do pedido).
- Aba de Buffet (só pra pousadas com a tag `buffet`): gerar voucher de café colonial pra hóspede ir até a cafeteria.

### 7.2 Equipe interna (papel `operador`)
- **Cozinha** (`/leitor`): lista de preparo do dia (ou outro dia escolhido) — quantas cestas por horário/pousada, decompostas em individual/dupla/tripla, e o total de itens a preparar (café, suco, tortinha, cupcake, queijo, presunto).
- **Cafeteria** (`/vouchers`): lista somente-leitura dos vouchers de Buffet enviados por todas as pousadas.

### 7.3 Administração (`/metricas`, `/administracao`)
- **Visão geral**: cartões de estatística (pedidos, unidades, pessoas, itens extras) com comparação ao período anterior, gráfico de pedidos/pessoas por período, ranking por unidade e por pousada, mapa de calor mensal de cestas com popup de detalhe por dia.
- **Pedidos**: lista completa, com busca, filtro por data exata, destaque de cancelados e de Buffet.
- **Histórico**: toda edição e cancelamento, filtrável por período e pousada (mesmo filtro global da Visão Geral).
- **Feedbacks**: avaliações dos hóspedes, uma por pousada/unidade.
- **Buffet**: ligar/desligar globalmente o recebimento de vouchers de Buffet + lista de vouchers enviados.
- **Exportação**: CSV e PDF do período filtrado, com coluna de Tipo (Cesta/Buffet).
- **Administração**: gestão de contas administrativas.

### 7.4 Automação (cron jobs, Vercel Cron)
- **Fechamento de métricas** — consolida e arquiva o período.
- **Lembrete de pendências** (16h) — avisa quem ainda não fez pedido no dia.
- **Relatório semanal** — inclui uma análise executiva gerada por IA (Anthropic) a partir dos números da semana.

### 7.5 Calendário e datas
- Cálculo de feriados nacionais (fixos + móveis via algoritmo de Páscoa de Meeus/Jones/Butcher: Carnaval, Sexta-Feira Santa, Corpo de Cristo) e fins de semana (`lib/feriados.ts`) — usado pra saber quando o Buffet pode ser oferecido e pra colorir o calendário.

### 7.6 Buffet de café colonial
- Voucher é um pedido normal por trás dos panos (`tipo = 'buffet'`), nunca soma com cesta no mesmo registro — um pedido é **ou** cesta **ou** Buffet.
- Aparece nas listagens/históricos/exports sempre com selo visual, mas fica de fora das métricas agregadas de cesta (gráficos, ranking, "quem não pediu hoje") pra não distorcer os números.
- Liga/desliga globalmente pelo admin; só pousadas com a tag `buffet` veem a opção.

### 7.7 Notificações push (Web Push)
- Funciona em Chrome, Edge, Firefox e Safari (macOS 16+ / iOS-iPadOS 16.4+, este último exige instalar na tela de início).
- Dispara em: novo pedido, edição, cancelamento, novo voucher de Buffet.
- Registro de evento + envio de push em paralelo, pra chegar o mais rápido possível.
- Aviso in-app sempre que a notificação está desativada, com instrução específica pra quem está no iPhone sem instalar o app.

---

## 8. O que está deliberadamente pausado

- **Envio automático pro grupo do WhatsApp**: cópia da mensagem + abertura do link do grupo estão **desativados temporariamente** a pedido — o pedido continua sendo salvo normalmente, só não copia nem redireciona mais. A infraestrutura (mensagens geradas, link do grupo, serviço `whatsapp-service/` via open-wa) continua no código, pronta pra ser reativada ou removida por completo quando decidido.

---

## 9. Modelo de dados (tabelas principais)

| Tabela | Papel |
|---|---|
| `pousadas` | Cadastro de cada pousada (nome, usuário, unidades, horários, tags) |
| `pedidos` | Todo pedido — cesta ou Buffet (`tipo`), com status, unidades, totais |
| `pedidos_log` | Histórico de edição/cancelamento |
| `user_roles` | Papel de cada conta (`admin` / `operador`) |
| `feedbacks` | Avaliações dos hóspedes |
| `configuracoes` | Configuração única do sistema (ex: Buffet ativo/desativado) |
| `eventos` | Log de eventos (novo pedido, edição, cancelamento, Buffet) pro sino de Avisos e pro push |
| `push_subscriptions` | Inscrições de notificação push por navegador/dispositivo |
| `metricas_exportadas` | Registro do que já foi exportado (CSV/PDF) |

---

*Documento gerado automaticamente a partir do código-fonte do repositório `Bernawsky/quitutes` — reflete o estado do sistema até o commit mais recente na branch `main`.*
