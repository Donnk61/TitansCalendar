# TITANS Cronograma

Calendario publico do semestre ativo da equipe TITANS, com leitura aberta e
administracao restrita para editores autorizados. O MVP e deliberadamente
limitado a calendario, avisos e ciclo de semestre.

## Stack

- Next.js com App Router
- React e TypeScript estrito
- Tailwind CSS
- FullCalendar React
- Supabase Postgres, Auth e Row Level Security
- Zod
- date-fns com locale `pt-BR`
- Vitest
- Playwright
- pnpm
- Deploy final na Vercel

## Comandos locais

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm start
pnpm format:check
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test:rls
pnpm supabase:types
```

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` e server-only. Nao use essa chave em componentes
cliente, arquivos marcados com `"use client"` ou codigo enviado ao navegador.

Na Vercel, configure essas variaveis separadamente em Development, Preview e
Production. Depois de alterar qualquer variavel, gere um novo deployment.
Detalhes de producao ficam em `docs/PRODUCTION.md`.

## Ordem das specs

1. `SPEC-00-fundacao-e-arquitetura.md`
2. `SPEC-01-design-system-e-shell.md`
3. `SPEC-02-banco-auth-e-seguranca.md`
4. `SPEC-03-camada-de-dados-publica.md`
5. `SPEC-04-calendario-publico.md`
6. `SPEC-05-filtros-detalhes-e-avisos.md`
7. `SPEC-06-login-e-painel-admin.md`
8. `SPEC-07-crud-e-recorrencia.md`
9. `SPEC-08-ciclo-do-semestre.md`
10. `SPEC-09-responsividade-acessibilidade-performance.md`
11. `SPEC-10-testes-e-qa.md`
12. `SPEC-11-deploy-vercel.md`

Execute uma spec por vez. Cada spec deve terminar com codigo funcional, testes
pertinentes, build passando e um relatorio curto.

## Politica de escopo

Nao adicionar chat, kanban, financeiro, presenca, tarefas individuais, ranking,
comentarios, uploads, rede social, gamificacao, gestao tecnica dos robos,
notificacoes externas, aplicativo instalavel, perfis personalizados,
compartilhamento individual de eventos, integracao direta com Google Docs ou
importacao automatica por IA no MVP.

## Arquitetura inicial

- `src/app`: rotas do App Router.
- `src/components`: componentes compartilhados por dominio visual.
- `src/features`: regras e componentes proximos de cada area de produto.
- `src/lib/dates`: convencoes centralizadas de data, timezone e calendario.
- `src/lib/validation`: validacao de contratos transversais.
- `src/server`: queries, actions e autorizacao de servidor.
- `src/types`: contratos de dominio compartilhados.
- `src/tests`: testes unitarios e e2e.

## Processo de build

1. Instalar dependencias com `pnpm install`.
2. Validar estilo com `pnpm lint`.
3. Validar tipos com `pnpm typecheck`.
4. Rodar testes unitarios com `pnpm test`.
5. Rodar smoke e2e com `pnpm test:e2e` quando os browsers do Playwright estiverem
   instalados.
6. Gerar build de producao com `pnpm build`.

## Smoke de producao

Depois do deploy:

```bash
PLAYWRIGHT_BASE_URL=https://sua-url-de-producao pnpm test:e2e
```

O endpoint `/api/health` deve retornar `{ "ok": true }` sem cache.

## Banco e Supabase

As migrations ficam em `supabase/migrations` e o seed de desenvolvimento em
`supabase/seed.sql`.

O fluxo local requer Docker Desktop:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test:rls
pnpm supabase:types
```

O teste RLS principal está documentado em `docs/spec02-rls-test-plan.md`.
