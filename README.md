# PromptLibrary

Aplicacao web para organizar, editar, buscar e sincronizar prompts pessoais.

O projeto foi construido com React + TanStack + Vite e hoje combina:

- biblioteca de prompts com categorias, tags e favoritos
- autenticacao com Supabase
- sincronizacao de dados do usuario com Supabase
- interface local-first com foco em uso rapido

## Stack

- React 19
- TypeScript
- Vite 7
- TanStack Router
- TanStack Query
- Tailwind CSS 4
- Radix UI
- Zustand
- Supabase

## Requisitos

- Node.js 20+ recomendado
- npm
- projeto Supabase configurado

## Variaveis de ambiente

Crie um arquivo `.env.local` com base em `.env.example`.

Exemplo:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Instalar dependencias

```bash
npm install
```

## Rodar em desenvolvimento

```bash
npm run dev
```

## Build de producao

```bash
npm run build
```

## Preview local do build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Estrutura principal

```text
src/
  components/
    app/          # telas e componentes de negocio
    ui/           # base de componentes reutilizaveis
  lib/
    auth.tsx      # contexto de autenticacao
    supabase.ts   # client do Supabase
    sync.ts       # sincronizacao de prompts, categorias e perfil
    promptStore.ts
  routes/
    __root.tsx
    index.tsx
```

## Banco de dados

O schema base usado pelo projeto esta em:

- `supabase-schema.sql`

## Observacoes

- o arquivo `.env.local` nao deve ser commitado
- o projeto usa hooks de validacao no push, entao `lint` e `build` podem rodar automaticamente antes de publicar
- alguns dados de interface podem existir localmente no navegador enquanto a sessao nao estiver autenticada
