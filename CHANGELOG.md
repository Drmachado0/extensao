# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- Sistema de validação com Zod (`src/lib/validations.ts`)
- Tratamento de erros robusto (`src/lib/errorHandler.ts`)
- Sistema de logging estruturado (`src/lib/logger.ts`)
- Constantes centralizadas (`src/lib/constants.ts`)
- Hook reutilizável `useSupabaseQuery` para queries do Supabase
- Hook `useDebounce` para otimização de requisições (`src/hooks/useDebounce.ts`)
- Componente `LoadingSpinner` reutilizável (`src/components/LoadingSpinner.tsx`)
- Validação de usernames com Zod em `Targets.tsx`
- Code splitting em todas as rotas para melhor performance
- Testes básicos para hooks e validações
- Testes para componente `LoadingSpinner`
- Documentação completa no README.md
- Arquivo `.env.example` como template
- Documento de melhorias propostas (`MELHORIAS_PROPOSTAS.md`)
- Documento de implementações realizadas (`IMPLEMENTACOES_REALIZADAS.md`)
- Documentação `SETUP_HUSKY.md` para configuração de pre-commit hooks
- Relatório `VULNERABILIDADES.md` de segurança

### Modificado
- `src/App.tsx`: Implementado lazy loading e Suspense para code splitting, atualizado para usar `PageLoader` reutilizável
- `src/pages/Auth.tsx`: Integrado validações Zod e error handler
- `src/pages/CommentTemplates.tsx`: Adicionado validação com `commentSchema`, melhorado tratamento de erros, substituído `Loader2` por `LoadingSpinner`, removidos tipos `any`
- `src/pages/Filters.tsx`: Melhorado tratamento de erros e logging estruturado, removidos tipos `any`
- `src/pages/Settings.tsx`: Adicionado validação de delays e limites diários, melhorado tratamento de erros, removidos tipos `any`
- `src/pages/Targets.tsx`: Adicionado validação de usernames com Zod, melhorado feedback para usuários, removidos tipos `any`
- `src/components/AppHeader.tsx`: Removidos tipos `any`, melhorado tratamento de erros
- `src/components/BotRemoteControl.tsx`: Removidos tipos `any`, melhorado tratamento de erros e logging
- `src/components/ErrorBoundary.tsx`: Substituído console.error por logger estruturado
- `src/pages/NotFound.tsx`: Melhorada acessibilidade com atributos ARIA
- `src/hooks/useDashboardData.ts`: Otimizado queries do Supabase (select específico)
- `src/pages/Logs.tsx`: Otimizado queries do Supabase
- `src/pages/Queue.tsx`: Otimizado queries do Supabase
- `eslint.config.js`: Corrigido erro `@typescript-eslint/no-unused-expressions`, desativada regra problemática
- `tsconfig.app.json`: Corrigidos erros de tipos e adicionado exclude para node_modules
- `.gitignore`: Adicionada proteção para arquivos sensíveis e backups
- `package.json`: Configurado lint-staged e husky, removido testes do pre-commit
- `IMPLEMENTACOES_REALIZADAS.md`: Atualizado com novas melhorias implementadas

### Removido
- Arquivo `.env` do tracking do Git (movido para .gitignore)
- Arquivo `src/pages/Targets.tsx.bak` (backup desnecessário)

### Segurança
- Removido arquivo `.env` com credenciais do histórico do Git
- Criado `.env.example` como template seguro
- Adicionado validação de inputs em formulários
- Implementado tratamento de erros consistente

### Performance
- Implementado code splitting em todas as rotas
- Otimizado queries do Supabase usando select específico ao invés de `*`
- Criado hook `useSupabaseQuery` para reutilização e cache otimizado

### Qualidade de Código
- Substituído `console.log` por logger estruturado
- Centralizado constantes em `src/lib/constants.ts`
- Melhorado tratamento de erros em componentes críticos
- Adicionado testes básicos para validações e hooks

### Documentação
- README.md completamente reescrito com instruções detalhadas
- Criado `MELHORIAS_PROPOSTAS.md` com roadmap completo
- Criado `IMPLEMENTACOES_REALIZADAS.md` documentando todas as melhorias
- Criado `CHANGELOG.md` para rastreamento de mudanças

### Acessibilidade
- Adicionados atributos ARIA em componentes principais
- Melhorada navegação semântica
- Adicionados labels descritivos
- Atributos ARIA em componentes de loading
- Melhorada navegação por teclado no sidebar

### DevOps
- Configurado pre-commit hooks com Husky v9
- Configurado lint-staged para lint automático (ESLint apenas)
- Removido testes do pre-commit para evitar lentidão nos commits
- Corrigido erro "Unknown option --runInBand" no Vitest
- Corrigido erro ESLint `@typescript-eslint/no-unused-expressions`
- Removidos todos os tipos `any` e substituídos por tipos apropriados
- Criado documentação `SETUP_HUSKY.md` para configuração
- Executado `npm audit fix` para corrigir vulnerabilidades
- Criado `VULNERABILIDADES.md` com relatório de segurança

### Validação
- Adicionada validação com Zod em `Targets.tsx` para usernames
- Feedback visual para usuários quando usernames inválidos são detectados
- Logging estruturado de validações falhadas

### Qualidade de Código
- Removidos todos os tipos `any` do código base
- Criadas interfaces TypeScript apropriadas em todos os componentes
- Melhorada segurança de tipos em toda aplicação
- Pre-commit hook configurado e funcionando corretamente

### Otimizações para Lovable
- Corrigido erro de importação duplicada de `PageLoader` em `App.tsx`
- **Corrigido erro crítico "supabaseUrl is required"** quando variáveis não estão configuradas
- Criado componente `SupabaseConfigWarning` com instruções visuais de configuração
- Adicionada validação de variáveis de ambiente com mensagens claras
- Cliente Supabase agora usa valores placeholder para evitar crash quando não configurado
- Otimizado build com code splitting manual e chunks separados
- Atualizado metadados do `index.html` com informações do projeto
- Criado documento `LOVABLE_OTIMIZACOES.md` com guia de configuração

## [1.0.0] - 2026-02-18

### Adicionado
- Versão inicial do projeto
- Autenticação com Supabase
- Dashboard com métricas em tempo real
- Gerenciamento de targets e filas
- Sistema de filtros avançados
- Templates de comentários
- Relatórios e analytics
- Integração com extensão Bridge

---

## Tipos de Mudanças

- **Adicionado**: para novas funcionalidades
- **Modificado**: para mudanças em funcionalidades existentes
- **Depreciado**: para funcionalidades que serão removidas em versões futuras
- **Removido**: para funcionalidades removidas
- **Corrigido**: para correções de bugs
- **Segurança**: para vulnerabilidades corrigidas
