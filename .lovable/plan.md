

# Revisao Completa e Melhorias - Organic Pro (Fase 2)

## Problemas Identificados

### 1. Funcao SQL Quebrada (Critico)
A funcao `get_rate_limits` ainda referencia a tabela `action_history` que foi removida na Fase 4. Precisa ser atualizada para usar `action_logs`.

### 2. Falta de Tratamento de Erros em Paginas
- **Filters.tsx**: `saveFilter` nao tem try/catch - erros sao silenciosos
- **Queue.tsx**: `bulkRemove`, `bulkWhitelist`, `bulkChangeAction`, `clearQueue` nao tratam erros
- **Accounts.tsx**: `togglePause`, `removeAccount` nao tratam erros
- **Subscription.tsx**: fetch sem tratamento de erro

### 3. Duplicacao de Logica de Contas
Cada pagina (Settings, Filters, Logs, Queue) reimplementa a logica de buscar contas Instagram. O hook `useAccounts` ja existe mas so e usado no Dashboard. Todas as outras paginas devem usa-lo.

### 4. Loading States Inconsistentes
- **Filters.tsx** (linha 254): usa `animate-pulse div` em vez de `Skeleton`
- **Settings.tsx** (linha 222): usa `animate-pulse div` em vez de `Skeleton`
- **Subscription.tsx** (linha 61): usa `animate-pulse div` em vez de `Skeleton`
- **Accounts.tsx** (linhas 253-256): usa `animate-pulse div` em vez de `Skeleton`

### 5. Landing Page Basica
- Sem secao de social proof / depoimentos
- Footer minimalista sem links uteis (Termos, Privacidade, Suporte)
- Sem secao "Como funciona" com passo-a-passo visual

### 6. Pagina de Contas - UX
- Nao mostra contagem de acoes hoje por conta no card
- Botao de remover conta nao pede confirmacao (risco de click acidental)

### 7. Dashboard - RecentActionsTable
- Mostra data absoluta em vez de tempo relativo (ex: "ha 5 min")
- Nao tem link para o perfil Instagram do alvo

### 8. Queue - Realtime sem Debounce
A pagina Queue faz `fetchQueue()` a cada evento realtime sem debounce, causando rajadas de queries.

### 9. Subscription - Enterprise nao aparece
O plano `enterprise` (atribuido ao usuario) nao esta no mapa `planDetails`, mostrando fallback para "Free".

---

## Plano de Implementacao

### Fase A: Correcao da Funcao SQL

Criar migracao para atualizar `get_rate_limits` substituindo `action_history` por `action_logs`:

```text
CREATE OR REPLACE FUNCTION public.get_rate_limits(p_user_id uuid)
RETURNS json LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'follows', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'follow' 
      AND status = 'success' AND created_at > now() - interval '24 hours'), 0),
    'unfollows', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'unfollow' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0),
    'likes', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'like' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0),
    'comments', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'comment' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0)
  );
$$;
```

### Fase B: Reutilizar useAccounts em Todas as Paginas

Substituir a logica duplicada de buscar contas em:
- `SettingsPage.tsx` (linhas 83-92) - remover useEffect + useState de accounts
- `Filters.tsx` (linhas 72-81) - remover useEffect + useState de accounts  
- `Logs.tsx` (linhas 80-83) - remover useEffect + useState de accounts
- `Queue.tsx` (linhas 92-105) - remover useEffect + useState de accounts

Importar `useAccounts()` de `@/hooks/useAccounts` em cada pagina.

### Fase C: Tratamento de Erros Consistente

Envolver todas as operacoes Supabase criticas em try/catch com toast de erro:
- **Filters.tsx**: `saveFilter`, `testFilters`
- **Queue.tsx**: `bulkRemove`, `bulkWhitelist`, `bulkChangeAction`, `clearQueue`, `handleModalSubmit`
- **Accounts.tsx**: `togglePause`, `removeAccount`, `openConnectModal`

### Fase D: Loading States com Skeleton

Substituir todos os `animate-pulse div` pelo componente `Skeleton` em:
- `SettingsPage.tsx` (linha 222-225)
- `Filters.tsx` (linha 252-256)
- `Subscription.tsx` (linha 61)
- `Accounts.tsx` (linhas 253-256)

### Fase E: Melhorias no Dashboard

**RecentActionsTable.tsx**:
- Substituir data absoluta por tempo relativo usando funcao `timeAgo`
- Adicionar link para perfil Instagram no username

**Subscription.tsx**:
- Adicionar plano `enterprise` ao mapa `planDetails` com icone Crown e preco "Custom"

### Fase F: Queue Debounce

Adicionar debounce de 2 segundos no realtime da Queue (mesmo padrao do Dashboard).

### Fase G: Confirmacao de Exclusao em Accounts

Adicionar `AlertDialog` antes de remover conta, mostrando aviso de que dados relacionados serao excluidos.

### Fase H: Landing Page Melhorada

- Adicionar secao "Como Funciona" com 3 passos visuais (Instale > Configure > Cresca)
- Adicionar secao de social proof com 3 depoimentos ficticios
- Expandir footer com links: Termos de Uso, Politica de Privacidade, Suporte, FAQ

---

## Arquivos Modificados

- Migracao SQL: `get_rate_limits` atualizada
- `src/pages/SettingsPage.tsx` - useAccounts + Skeleton + error handling
- `src/pages/Filters.tsx` - useAccounts + Skeleton + error handling
- `src/pages/Logs.tsx` - useAccounts
- `src/pages/Queue.tsx` - useAccounts + debounce + error handling
- `src/pages/Accounts.tsx` - Skeleton + confirmacao exclusao + error handling
- `src/pages/Subscription.tsx` - Skeleton + plano enterprise
- `src/pages/LandingPage.tsx` - secoes novas + footer expandido
- `src/components/dashboard/RecentActionsTable.tsx` - timeAgo + links Instagram

