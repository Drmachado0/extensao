# External Integrations

**Analysis Date:** 2026-04-16

## APIs & External Services

**None detected.** The application does not integrate with third-party REST APIs or external services beyond Supabase (listed below).

## Data Storage

**Databases:**
- PostgreSQL via Supabase
  - Connection: Supabase REST API client
  - Client: @supabase/supabase-js 2.103.2
  - URL env var: `VITE_SUPABASE_URL`
  - Key env var: `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Project ID env var: `VITE_SUPABASE_PROJECT_ID`

**Database Tables (Schema):**
The application uses multiple Supabase tables for construction project financial management:
- `obra_config` - Project configuration (name, location, budget, dates, responsible person)
- `obra_transacoes_fluxo` - Cash flow transactions with description, category, amount, date, payment method
- `obra_compras` - Purchase records with status and delivery tracking
- `obra_comissao_pagamentos` - Commission payment records with soft delete support
- `obra_movimentacoes_extraidas` - Extracted movements from documents with review status
- `obra_eventos_processamento` - Document processing event log
- `obra_documentos_processados` - Processed document metadata
- `obra_contas_financeiras` - Financial accounts/payment methods
- `agendamentos` - Appointment/scheduling records (medical context, likely legacy)
- `action_log` - User action audit trail
- Other tables exist (see `src/integrations/supabase/types.ts` for full schema)

**File Storage:**
- None detected. No file upload integration present.

**Caching:**
- React Query (TanStack Query) in-memory client-side caching
- No backend caching layer (Redis/Memcached) detected

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication
  - Implementation: Email/password via `supabase.auth.*` methods
  - Session management: localStorage-based with auto-refresh tokens
  - Persistence: Enabled via `persistSession: true`
  - Auto-refresh: Enabled via `autoRefreshToken: true`

**Auth Integration Points:**
- `src/hooks/useAuth.ts` - Main auth hook managing session state
- `src/integrations/supabase/client.ts` - Auth client configuration
- `src/pages/LoginPage` - Login interface
- `src/hooks/useUserRole.ts` - Role-based access control

**Roles/Authorization:**
- Role system: admin, financeiro (finance), construtor (contractor), visualizador (viewer)
- Role-based access control to pages and features throughout the app

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Bugsnag, or similar service.

**Logs:**
- Browser console logging (implicit)
- Supabase action audit trail via `action_log` table
- Application event logs via `obra_eventos_processamento` table

**Real-time Features:**
- Supabase real-time subscriptions via `useRealtimeSubscription` hook
- Real-time updates on table changes

## CI/CD & Deployment

**Hosting:**
- Not detected in configuration. Application is a static SPA (Single Page Application)
- Expected deployment: Any static hosting provider (Netlify, Vercel, GitHub Pages, S3+CloudFront, etc.)

**CI Pipeline:**
- None detected. No GitHub Actions, GitLab CI, or similar configuration in the codebase.

**Build Output:**
- Vite builds to `dist/` directory (standard convention)

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous key (public/safe to expose)
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID (used in ConfiguracoesPage)

**Secrets location:**
- `.env` file present at project root (`/c/Users/Machado/Downloads/Lovable/Obra/otovisionobra/.env`)
- Environment variables loaded by Vite at build/dev time
- `.env` file should NOT be committed to git

## Webhooks & Callbacks

**Incoming:**
- None detected. The application does not expose webhook endpoints (it's a client-side SPA).

**Outgoing:**
- Supabase real-time subscriptions handle reactive updates
- No outbound webhook calls detected

## Data Flow Patterns

**Typical Query Pattern:**
```typescript
// Via Supabase REST API
const { data, error } = await supabase
  .from("table_name")
  .select("columns")
  .filter_conditions();
```

**Real-time Subscription Pattern:**
```typescript
// Via Supabase real-time channel
const channel = supabase
  .channel("table_name")
  .on("postgres_changes", { event: "*", schema: "public", table: "table_name" }, callback)
  .subscribe();
```

**State Management Pattern:**
- Supabase queries often wrapped in React components via `useEffect` + state
- TanStack Query integration present but not heavily utilized (primarily useQuery client provider in App.tsx)
- Component-level state for form inputs and UI state

## Data Synchronization

**Transactional Consistency:**
- Supabase handles transactional semantics
- Soft deletes used (deleted_at timestamp) instead of hard deletes for audit trail

**Sync Strategies:**
- Manual fetch-on-demand in `useEffect` hooks
- Real-time subscriptions for live updates
- No offline-first or sync queue detected

---

*Integration audit: 2026-04-16*
