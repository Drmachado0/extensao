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
- Code splitting em todas as rotas para melhor performance
- Testes básicos para hooks e validações
- Documentação completa no README.md
- Arquivo `.env.example` como template
- Documento de melhorias propostas (`MELHORIAS_PROPOSTAS.md`)
- Documento de implementações realizadas (`IMPLEMENTACOES_REALIZADAS.md`)

### Modificado
- `src/App.tsx`: Implementado lazy loading e Suspense para code splitting
- `src/pages/Auth.tsx`: Integrado validações Zod e error handler
- `src/components/ErrorBoundary.tsx`: Substituído console.error por logger estruturado
- `src/components/BotRemoteControl.tsx`: Melhorado tratamento de erros e logging
- `src/pages/NotFound.tsx`: Melhorada acessibilidade com atributos ARIA
- `src/pages/Targets.tsx`: Otimizado queries e melhorado logging
- `src/hooks/useDashboardData.ts`: Otimizado queries do Supabase (select específico)
- `src/pages/Logs.tsx`: Otimizado queries do Supabase
- `src/pages/Queue.tsx`: Otimizado queries do Supabase
- `tsconfig.app.json`: Corrigidos erros de tipos e adicionado exclude para node_modules
- `.gitignore`: Adicionada proteção para arquivos sensíveis e backups

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
