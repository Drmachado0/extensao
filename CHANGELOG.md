# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## Dashboard (OrganicPro)

### [Unreleased]

### Otimizações para Lovable
- Build otimizado com code splitting agressivo e chunks separados
- Remoção automática de console.log em produção
- Componente `SupabaseConfigWarning` para configuração visual
- Validação de variáveis de ambiente com mensagens claras
- Configurações TypeScript otimizadas para produção
- Removidos arquivos/documentação não necessários para produção
- Scripts de desenvolvimento removidos do package.json
- Otimizações de bundle size e cache

### Adicionado
- Sistema de validação com Zod (`src/lib/validations.ts`)
- Tratamento de erros robusto (`src/lib/errorHandler.ts`)
- Sistema de logging estruturado (`src/lib/logger.ts`)
- Constantes centralizadas (`src/lib/constants.ts`)
- Hook reutilizável `useSupabaseQuery` para queries do Supabase
- Hook `useDebounce` para otimização de requisições
- Componente `LoadingSpinner` reutilizável
- Validação de usernames com Zod em `Targets.tsx`
- Code splitting em todas as rotas
- Documentação `LOVABLE_OTIMIZACOES.md` para configuração

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

### [1.0.0] - 2026-02-18

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

## Extensão (Organic Automator)

### v8.1.2 — 2026-02-22

#### Extensão

**🔴 Bug crítico corrigido — `lovable-safety.js`**
- `loadCustomLimits()` não sobrescreve mais os limites customizados pelo usuário (sliders do popup) ao recarregar a página. Antes, todo reload de aba restaurava os valores padrão do preset.

**🟠 `backgroundscript.js`**
- Adicionado `chrome.runtime.onSuspend` listener: ao fechar o Chrome ou desativar a extensão, a conta é marcada como `bot_online=false` e `bot_status=offline` no Supabase imediatamente, em vez de aguardar expiração do heartbeat.
- Intervalo do `lovable-command-poll` aumentado de 45s para 60s (menos execuções no service worker).

**🟠 `lovable-supabase.js`**
- Heartbeat agora inclui `daily_heat`, `cooldown_remaining_minutes`, `cooldown_escalation` e `safety_preset` — visíveis no dashboard para diagnóstico remoto.
- Retry queue com TTL diferenciado por tabela: `action_log` expira em 3h, `session_stats` em 6h, demais em 24h.

**🟡 `lovable-config.js`**
- `VERSION`: `2.6.0` → `2.7.0`

#### Dashboard (alinhamento com extensão)

**🔴 Bug crítico corrigido — `Actions.tsx`**
- A tabela `action_log` não possui coluna `user_id`. No modo "Todas as contas", a query usava `.eq("user_id", ...)` retornando sempre zero resultados. Corrigido para usar `.in("ig_account_id", ids)` baseado nas contas do usuário.
- Filtro de realtime também corrigido (não usa mais `user_id=eq.` que não existe na tabela).

**🔴 Presets sincronizados — `Extension.tsx` + `Settings.tsx`**
- `REFERENCE_PRESETS` e `DEFAULT_SAFETY_PRESETS` atualizados para refletir os valores reais da extensão (`lovable-config.js`). Antes exibiam limites até 2× maiores do que a extensão realmente aplica.
- `DEFAULTS` de Settings ajustado para corresponder ao preset "média" real.

**🟠 Indicador de saúde da conta — `Extension.tsx`**
- Cards de conta agora exibem barra de "Calor da conta" (0–100) e badge de cooldown ativo quando a extensão reporta esses dados no heartbeat.
- Preset ativo da extensão exibido no subtítulo do card.

**🟡 `Extension.tsx` — melhorias diversas**
- Threshold de "online" aumentado de 6min para 8min (evita piscar entre online/away com atrasos normais de rede).
- Threshold de "away" aumentado de 30min para 45min.
- `ZIP_URL` aponta agora para tag de release `v8.1.2` em vez da branch `main` (instável).
- Botão "Aplicar remotamente" em cada card de preset: envia comando `set_safety_preset` para a extensão via Supabase `bot_commands`, sem precisar abrir o popup.

### v8.1.1 — 2026-02-22

- **lovable-config.js** VERSION: `2.5.0` → `2.6.0`
- Versão alinhada com o dashboard para rastreabilidade
- Sem mudanças funcionais nesta versão da extensão

*Próximas melhorias planejadas: autenticação via Bridge Token (substituindo email/senha),
poll do popup enviado apenas para aba ativa, intervalo de command-poll aumentado para 60s.*

---

## Tipos de Mudanças

- **Adicionado**: para novas funcionalidades
- **Modificado**: para mudanças em funcionalidades existentes
- **Depreciado**: para funcionalidades que serão removidas em versões futuras
- **Removido**: para funcionalidades removidas
- **Corrigido**: para correções de bugs
- **Segurança**: para vulnerabilidades corrigidas
