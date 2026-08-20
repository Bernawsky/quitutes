# quitutes

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Estrutura de entrega de cestas

O app implementa, dentro do próprio Next.js, a estrutura descrita no mapa mental "Estrutura de
entrega de cestas": pedidos organizados por pousada (com horário fixo de entrega), geração da
mensagem padronizada para o WhatsApp, folha de logística A4 (com impressão automática) para cada
pedido concluído, feedback via QR Code, dashboard de métricas com fechamento de período, previsão
de demanda, painel de pendências e controle simples de estoque.

Toda a automação que antes rodava no N8N (webhook recebendo o fechamento de métricas e gravando no
Supabase) foi trazida para dentro do app:

- `app/actions/metricas.ts` — `exportarMetricas` fecha um período (dia/semana/mês/ano) e grava em
  `metricas_exportadas`, substituindo o fluxo "Receber PDF → Salvar Métricas no Supabase" do N8N.
- `app/api/cron/fechar-metricas/route.ts` — endpoint chamado pelo Vercel Cron (`vercel.json`) para
  fechar as métricas do dia automaticamente, sem depender de nenhum serviço externo. Opcionalmente
  protegido por uma variável de ambiente `CRON_SECRET`.
- `app/logistica/[id]` — folha de logística A4 gerada e impressa automaticamente ao concluir um
  pedido, com QR Code de feedback (`app/feedback/[id]`).
- `app/estoque` — controle simples de estoque de insumos.

O N8N não é mais utilizado por este projeto.

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_86u25v84Pzu5cwuTlPVBSI16dd7c)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
