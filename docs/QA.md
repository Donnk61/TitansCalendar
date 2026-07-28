# QA e Testes

## Automação Local

Execute antes de concluir uma spec:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Banco de Teste

- Use Supabase local ou um projeto Supabase exclusivo de teste.
- Nunca rode E2E destrutivo contra produção.
- Seeds devem ser idempotentes e criar admin/editor conhecidos.
- Limpeza entre suítes deve remover apenas dados do projeto de teste.
- RLS local roda com `pnpm run supabase:test:rls` depois de `supabase start` e `supabase db reset`.

## Cobertura Atual

- Regras de datas, fuso e semana segunda-domingo.
- Adaptação pública de eventos, all-day e multi-dia.
- Filtros públicos, status cancelado e avisos vigentes/expirados.
- Recorrência semanal e quinzenal.
- Regras administrativas puras: semestre, duplicidade, conflito e escopo de recorrência.
- Segurança de migrações/RLS por inspeção estática enquanto o banco local não está disponível.
- E2E público desktop e mobile compacto.
- E2E smoke de admin sem Supabase configurado.

## Checklist Manual

- Chrome, Firefox e WebKit.
- 320, 390, 768 e 1440 px.
- Navegação por teclado: header, filtros, calendário, agenda, modais e admin.
- `prefers-reduced-motion`.
- Rede lenta.
- Semestre vazio e sem semestre ativo.
- Muitos eventos no mesmo dia.
- Descrição longa no limite.
- Recorrência próxima ao fim do semestre.
- Sessão expirada durante edição.
- Clique duplo em salvar.

## Riscos Restantes

- Fluxos E2E destrutivos de editor/admin dependem de Supabase local ou projeto de teste com usuários reais.
- Docker/virtualização ainda precisa estar disponível para validar pgTAP/RLS em execução.
