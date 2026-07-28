# Guia Rápido para Liderança

## Autorizar Editor

1. Entrar em `/admin` com uma conta admin.
2. Abrir `Acessos`.
3. Adicionar e-mail autorizado como `Editor` ou `Admin`.
4. O editor acessa `/admin/login` e recebe Magic Link.

## Criar Semestre

1. Abrir `Semestre`.
2. Criar o próximo semestre com nome, início e fim.
3. Ativar quando estiver pronto para publicação.
4. Arquivar o semestre anterior com confirmação `ARQUIVAR`.

## Criar Evento Recorrente

1. Abrir `Eventos`.
2. Selecionar `Novo Evento`.
3. Preencher dados principais.
4. Em `Repetir`, escolher `Toda Semana` ou `A Cada 2 Semanas`.
5. Conferir as datas geradas.
6. Salvar.

## Publicar Aviso

1. Abrir `Avisos`.
2. Criar aviso com título, texto, severidade e vigência.
3. Marcar `Publicado`.
4. Relacionar evento quando necessário.

## Verificar Logs

Na Vercel:

1. Abrir o projeto.
2. Entrar no deployment ativo.
3. Ver `Logs`.
4. Procurar falhas de route handlers, server actions ou Supabase.
