<div align="center">

<img src="public/prompt-icon.png" width="96" alt="Prompt Vault Logo" />

# Prompt Vault

### Organize, edite e sincronize seus prompts de IA em um só lugar

[![Status](https://img.shields.io/badge/status-active-4ade80?style=flat-square)](https://github.com/alisoncardosoo/prompt-vault)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_Sync-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square)](LICENSE)

</div>

---

## Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)
- [Autor](#autor)
- [Licença](#licença)

---

## Sobre

**Prompt Vault** é uma aplicação web local-first para quem trabalha intensamente com IA. Em vez de perder tempo procurando prompts espalhados em arquivos de texto, notas ou histórico de conversas, você tem uma biblioteca centralizada, organizada por categorias e tags, com busca instantânea e sincronização em nuvem via Supabase.

**Problema que resolve:** profissionais que usam ferramentas de IA (ChatGPT, Claude, Gemini, etc.) acumulam dezenas de prompts reutilizáveis sem nenhum sistema para gerenciá-los. O Prompt Vault resolve isso com uma interface rápida, offline-first e sincronizada.

**Público-alvo:** desenvolvedores, designers, redatores, pesquisadores e qualquer pessoa que usa IA produtivamente no dia a dia.

---

## Funcionalidades

### Biblioteca

- Criação, edição e exclusão de prompts
- Organização por **categorias coloridas** (amber, sky, mint, lavender, rose)
- Sistema de **tags** livres para busca semântica
- **Favoritos** para acesso rápido
- Visualizações: Todos, Favoritos, Recentes, Por categoria, Por tag, Anexos
- **Lixeira** com TTL de 30 dias e restauração

### Editor

- Editor dedicado com suporte a **variáveis dinâmicas** — defina `{{variavel}}` no texto e preencha na hora de usar
- Campo de notas privadas por prompt
- Avaliação por estrelas
- Importação de prompt via **imagem** (OCR)

### Sincronização & Auth

- Autenticação com **Supabase** (email/senha)
- Sincronização bidirecional de prompts, categorias e perfil
- Interface totalmente funcional **sem conexão** (local-first com Zustand persist)

### Integrações de IA

- Configuração de provider: **OpenAI** ou **Anthropic**
- Chave de API armazenada localmente

### UX

- Tema **claro / escuro / sistema**
- Layout responsivo — funciona em mobile
- **PWA instalável** — adicione à tela inicial
- Sidebar colapsável com navegação por teclado
- Busca instantânea

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TanStack Router |
| Linguagem | TypeScript 5.8 |
| Build | Vite 7 |
| Estilização | Tailwind CSS 4 + Radix UI |
| Estado global | Zustand (com persist) |
| Data fetching | TanStack Query |
| Backend / Auth | Supabase |
| Deploy | Vercel |
| Componentes | shadcn/ui |

---

## Arquitetura

```
src/
├── components/
│   ├── app/              # Componentes de negócio
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── CategoryCards.tsx
│   │   ├── PromptCard.tsx
│   │   ├── DetailPanel.tsx
│   │   ├── PromptEditor.tsx
│   │   ├── VariablesModal.tsx
│   │   ├── SettingsModal.tsx
│   │   └── ImageImportDialog.tsx
│   └── ui/               # Base de componentes reutilizáveis (shadcn)
├── lib/
│   ├── promptStore.ts    # Store Zustand — estado global
│   ├── auth.tsx          # Contexto de autenticação
│   ├── supabase.ts       # Client Supabase
│   └── sync.ts           # Sincronização cloud
├── routes/
│   ├── __root.tsx
│   └── index.tsx         # Página principal
└── styles.css
```

---

## Instalação

### Pré-requisitos

- Node.js 20+
- npm
- Conta e projeto no [Supabase](https://supabase.com)

### Passo a passo

```bash
# Clone o repositório
git clone https://github.com/alisoncardosoo/prompt-vault.git

# Entre na pasta
cd prompt-vault

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rode em desenvolvimento
npm run dev
```

### Build de produção

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Variáveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

> O arquivo `.env.local` não deve ser commitado.

---

## Banco de dados

O schema completo do Supabase está em [`supabase-schema.sql`](supabase-schema.sql).

Execute o arquivo no SQL Editor do seu projeto Supabase para criar as tabelas necessárias (`prompts`, `categories`, `profiles`).

---

## Roadmap

- [x] CRUD de prompts
- [x] Categorias e tags
- [x] Favoritos e lixeira
- [x] Autenticação Supabase
- [x] Sincronização cloud
- [x] Editor com variáveis dinâmicas
- [x] Importação por imagem
- [x] PWA instalável
- [x] Tema escuro
- [ ] Compartilhamento de prompts públicos
- [ ] Extensão de navegador
- [ ] App mobile nativo

---

## Contribuição

Contribuições são bem-vindas.

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: minha feature'`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## Autor

<div align="center">

<a href="https://github.com/alisoncardosoo">
  <img src="https://github.com/alisoncardosoo.png" width="80" style="border-radius:50%" alt="Alison Cardoso"/>
</a>

**Alison Cardoso**

[![GitHub](https://img.shields.io/badge/GitHub-alisoncardosoo-181717?style=flat-square&logo=github)](https://github.com/alisoncardosoo)

</div>

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.

---

<div align="center">

Feito com React, TypeScript e Supabase

</div>
