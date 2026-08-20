# quitutes

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Sistema de Pedidos — Pousadas Quitutes

Este app é a migração completa e funcionalmente equivalente do sistema que rodava na Lovable
(`Quitutes Reborn`), agora hospedado inteiramente na Vercel e com o backend no Supabase. Nenhuma
funcionalidade foi deixada para trás:

- **Portal por pousada**: login próprio (usuário/senha) para cada uma das 4 pousadas atendidas —
  Vale do Sol, Alquimia Chalés, Pousada Ser.Tão e Pousada Itaoka Belvedere — cada uma com sua
  própria URL fixa (`/vale-do-sol`, `/alquimia-chales`, `/ser-tao`, `/itaoka-belvedere`) além do
  portal genérico em `/`. A sessão da pousada fica salva no navegador (`hooks/use-pousada.ts`).
- **Montagem do pedido**: horário (obrigatório), quantidade de pessoas (obrigatória), itens extras
  (café, suco, chá, água quente, ovos), tipo de cesta (vegana / sem glúten / sem lactose) e
  observação livre por unidade — com validação obrigatória de horário e pessoas tanto na interface
  quanto no backend (`lib/pedidos-validacao.ts`).
- **Envio para o WhatsApp**: a mensagem é copiada para a área de transferência dentro do próprio
  gesto de clique (evitando bloqueios do navegador, com fallback via `execCommand`), com
  confirmação visual, e o grupo é aberto automaticamente logo em seguida.
- **Administração** (`/auth` → `/metricas`, protegida por Supabase Auth + papel `admin` em
  `user_roles`): dashboard de métricas por período (dia/semana/mês/ano) e por pousada, edição e
  cancelamento de pedidos (cada ação gera e copia a mensagem correspondente para o WhatsApp),
  exportação de relatórios em PDF e CSV.
- **Banco de dados**: 100% Supabase (Postgres + RLS) — sem Neon. Pousadas só podem inserir
  pedidos; apenas administradores podem ler, editar ou excluir.

A automação que antes rodava no N8N (webhook recebendo o fechamento de métricas) foi trazida para
dentro do próprio app, sem depender mais de nenhum serviço externo:

- O diálogo de exportação (`components/exportar-dialog.tsx` + `app/actions/metricas.ts`) permite
  fechar qualquer período manualmente, gravando o resumo em `metricas_exportadas`.
- `app/api/cron/fechar-metricas/route.ts`, agendado pelo Vercel Cron (`vercel.json`), fecha as
  métricas do dia automaticamente, autenticado por `CRON_SECRET` e usando a service role do
  Supabase (`lib/supabase/admin.ts`).

O N8N não é mais utilizado por este projeto.

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e configure também no projeto da Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — já preenchidas no exemplo (são
  públicas por design).
- `SUPABASE_SERVICE_ROLE_KEY` — pegue em Supabase → Project Settings → API. Nunca exponha no
  cliente.
- `CRON_SECRET` — qualquer segredo forte; usado para autorizar a chamada do Vercel Cron.

### Contas administrativas

As duas contas administrativas (Bernardo Campos e Quitutes da Beth) precisam existir no Supabase
Auth deste projeto — crie-as em Authentication → Users (ou peça para a pessoa se cadastrar) e então
insira o papel de admin:

```sql
insert into public.user_roles (user_id, role)
values ('<uuid-do-usuario>', 'admin');
```

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
