
# Revisao Completa e Melhorias do Organic Pro

## Problemas Identificados

### 1. Seguranca (Critico)
- **13 politicas RLS permissivas** (`USING (true)` / `WITH CHECK (true)`) em multiplas tabelas. Qualquer usuario autenticado pode ler/modificar dados de outros usuarios.
- Corrigir todas as politicas para usar `auth.uid() = user_id`.

### 2. Erros e Warnings no Console
- **AuthApiError: Invalid Refresh Token** - o `useAuth` nao trata tokens expirados/invalidos. Adicionar tratamento para limpar sessao corrompida.
- **Warning: Function components cannot be given refs** no `Badge` da LandingPage - usar `forwardRef` no componente Badge ou remover ref desnecessaria.

### 3. Bug: Logs Table sem React Keys corretas
- Na pagina Logs, os fragmentos `<>` dentro do `.map()` nao tem `key` prop. Substituir por `<React.Fragment key={log.id}>`.

### 4. Bug: Settings gera connectionKey aleatoria a cada load
- `SettingsPage` chama `crypto.randomUUID()` toda vez que carrega settings, ignorando a chave real salva no banco. Deve carregar do banco.

### 5. Dashboard: `useDashboardData` nao filtra por conta
- O hook busca dados globais do usuario sem filtrar por `account_id`. Quando o usuario tem multiplas contas, os dados ficam misturados.

### 6. Tabelas duplicadas no banco
- Existem tabelas redundantes: `action_logs` vs `action_history` vs `activity_log`, `filters` vs `action_filters` vs `filter_presets`, `accounts_queue` vs `target_queue`. Limpeza necessaria.

### 7. Auth Page: navegacao no render
- `Auth.tsx` chama `navigate()` durante render quando user ja esta logado. Deve usar `<Navigate>` ou `useEffect`.

---

## Plano de Implementacao

### Fase 1: Correcoes Criticas de Seguranca

Criar migracao SQL para substituir todas as politicas RLS `USING (true)` por `USING (auth.uid() = user_id)` nas tabelas:
- `action_logs`, `action_settings`, `action_filters`, `target_queue`, `instagram_accounts`, `subscriptions`, `whitelist`, `notification_preferences`, `notification_logs`, `profiles`, `growth_stats`, `media_queue`, `scheduled_actions`

Para `instagram_accounts` que usa `user_id` nullable, adicionar `USING (auth.uid() = user_id)`.

### Fase 2: Correcoes de Bugs

**2.1 - useAuth.tsx**: Adicionar tratamento de erro no `onAuthStateChange` para `TOKEN_REFRESHED` com falha, limpando localStorage.

**2.2 - Logs.tsx**: Substituir fragmentos `<>` por `<React.Fragment key={log.id}>` no map da tabela.

**2.3 - Auth.tsx**: Substituir `navigate()` no render por `<Navigate to="/dashboard" replace />`.

**2.4 - SettingsPage.tsx**: Carregar `connectionKey` do banco (`action_settings` ou `instagram_accounts.connection_key`) em vez de gerar uma nova UUID toda vez.

### Fase 3: Melhorias de Codigo e UX

**3.1 - Extrair hooks customizados**: 
- `useAccounts()` - logica de buscar contas Instagram (usada em Settings, Filters, Logs, Queue)
- `useSettings(accountId)` - logica de carregar/salvar settings

**3.2 - Dashboard multi-conta**:
- Adicionar seletor de conta no Dashboard
- Filtrar metricas por `account_id` selecionado

**3.3 - Melhorias visuais**:
- Adicionar `animate-fade-in` com stagger nos cards do Dashboard
- Skeleton loaders consistentes em todas as paginas (substituir `animate-pulse div` por componente `Skeleton`)
- Adicionar empty states mais informativos com CTAs

**3.4 - Tratamento de erros nas queries Supabase**:
- Todas as chamadas Supabase ignoram erros. Adicionar tratamento com toast de erro.
- Envolver chamadas criticas (save, delete) em try/catch com feedback.

**3.5 - Performance**:
- Logs stats query busca todos os registros para contar sucesso (ineficiente). Usar `count` com filtro.
- Dashboard faz 10 queries paralelas a cada INSERT via realtime. Adicionar debounce de 2s no `fetchAll`.

**3.6 - Landing Page**:
- Corrigir warning do Badge (forwardRef)
- Adicionar secao de social proof / depoimentos
- Adicionar footer com links uteis

### Fase 4: Limpeza de Banco (Opcional - requer confirmacao)

Tabelas potencialmente redundantes que podem ser removidas apos confirmar que nao estao em uso pela extensao Chrome:
- `action_history` (substituida por `action_logs`)
- `activity_log` (substituida por `action_logs`)  
- `filters` (substituida por `action_filters`)
- `filter_presets` (substituida por `action_filters`)
- `accounts_queue` (substituida por `target_queue`)

---

## Detalhes Tecnicos

### Migracao RLS (exemplo para action_logs)
```text
DROP POLICY IF EXISTS "action_logs_select" ON action_logs;
CREATE POLICY "action_logs_select" ON action_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_logs_insert" ON action_logs;  
CREATE POLICY "action_logs_insert" ON action_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Repetir para UPDATE e DELETE
```

### Debounce no useDashboardData
Adicionar `useRef` com timer para debounce de 2 segundos no callback do realtime, evitando refetch em rajada.

### Hook useAccounts
```text
// src/hooks/useAccounts.ts
// Retorna { accounts, selectedAccountId, setSelectedAccountId, loading }
// Reutilizado em Settings, Filters, Logs, Queue
```

### Arquivos modificados
- `src/hooks/useAuth.tsx` - tratamento token invalido
- `src/hooks/useDashboardData.ts` - debounce + filtro por conta
- `src/hooks/useAccounts.ts` (novo) - hook compartilhado
- `src/pages/Logs.tsx` - fix keys + error handling
- `src/pages/Auth.tsx` - fix navigate no render
- `src/pages/SettingsPage.tsx` - fix connectionKey
- `src/pages/Dashboard.tsx` - seletor de conta
- `src/pages/LandingPage.tsx` - fix Badge warning
- `src/components/dashboard/RecentActionsTable.tsx` - timestamps relativos
- Migracao SQL para RLS
