# Produção e Deploy

## Ambientes

Configure variáveis separadamente para Development, Preview e Production na
Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

`SUPABASE_SERVICE_ROLE_KEY` é server-only. Não use essa chave em Client
Components, logs, screenshots ou arquivos enviados ao navegador.

## Supabase Produção

1. Criar projeto Supabase de produção.
2. Aplicar migrations em ordem.
3. Executar seed somente para tipos e projetos aprovados.
4. Criar semestre inicial.
5. Inserir pelo menos um admin em `editor_access`.
6. Revisar RLS e executar `pnpm run supabase:test:rls` no ambiente de teste.
7. Configurar Auth URL:
   - Site URL: URL pública final.
   - Redirect URLs: `/admin/auth/callback` da produção e previews aprovados.

## Vercel

1. Importar o repositório.
2. Confirmar framework Next.js e pnpm.
3. Usar build command padrão.
4. Definir branch de produção.
5. Configurar variáveis por ambiente.
6. Após alterar variáveis, criar novo deployment.

Preview deployments devem usar Supabase de teste ou não ter service role de
produção. Não permita que previews desconhecidos alterem dados produtivos.

## Domínio

Use uma URL dedicada, por exemplo:

```text
https://cronograma.dominio-da-equipe
```

Depois de configurar o domínio:

1. Atualizar `NEXT_PUBLIC_SITE_URL` na Vercel.
2. Atualizar Site URL e Redirect URLs no Supabase Auth.
3. Criar novo deployment.
4. Rodar smoke test.

## Smoke Test

Rode contra a URL final:

```bash
PLAYWRIGHT_BASE_URL=https://sua-url pnpm test:e2e
```

Checklist manual:

- Página pública abre em HTTPS.
- Semestre ativo aparece.
- Mês, semana e semestre funcionam.
- Filtros funcionam.
- Login de admin por Magic Link funciona.
- Editor cria e edita evento.
- Editor cria recorrência quinzenal.
- Aviso publicado aparece.
- Mobile usa calendário compacto.
- Usuário não autorizado recebe acesso negado.

## Rollback

- Vercel: usar Instant Rollback para promover um deployment anterior.
- CLI: usar `vercel rollback` quando o projeto estiver conectado.
- Banco: migrations devem ter plano de reversão manual antes de aplicar em
  produção. Para mudanças destrutivas, criar backup e janela de manutenção.

## Logs

Verifique:

- Route handlers de auth e health.
- Server Actions administrativas.
- Falhas Supabase sem imprimir chaves.
- Erros de build/deployment.

## URLs Para Liderança

Preencher após deploy:

```text
URL pública:
URL administrativa: /admin
URL health: /api/health
Commit:
Ambiente Supabase:
```
