# Architecture

**Analysis Date:** 2026-04-16

## Pattern Overview

**Overall:** Layered Client-Side SPA (Single Page Application) with Progressive Enhancement

**Key Characteristics:**
- React 18 with TypeScript for type safety
- Vite as build tool with hot module replacement (HMR)
- Client-first data persistence via localStorage with optional Supabase sync
- Route-based code splitting with React lazy() for page components
- Component library (shadcn/ui) over custom component development
- Custom hook architecture for state management and business logic
- Multi-tier approach: auth → pages → components → hooks → utilities

## Layers

**Presentation Layer:**
- Purpose: React components rendering UI, form handling, data display
- Location: `src/components/`, `src/pages/`
- Contains: Page components (21 pages), reusable components (13 core), UI library (50+ components)
- Depends on: Hooks, utilities, types
- Used by: Router (via React Suspense + code splitting)

**Business Logic / State Layer:**
- Purpose: Data management, persistence, and computation
- Location: `src/hooks/`, `src/contexts/`, `src/lib/`
- Contains: Custom hooks (useLocalStorage, useFormValidation, useObraConfig), React Context (AuthContext), utility functions
- Depends on: Supabase client, localStorage API, React
- Used by: All page and component layers

**Data Access Layer:**
- Purpose: Hybrid persistence (localStorage + Supabase)
- Location: `src/lib/storage.ts`, `src/lib/supabaseSync.ts`, `src/integrations/supabase/`
- Contains: Storage abstractions, database sync logic, type definitions from Supabase
- Depends on: Supabase JS SDK, localStorage
- Used by: Custom hooks (useLocalStorage), contexts

**Integration Layer:**
- Purpose: External services and authentication
- Location: `src/integrations/supabase/`
- Contains: Supabase client initialization, database types
- Depends on: Supabase JS SDK
- Used by: Auth context, data sync functions

**Routing & Framework Layer:**
- Purpose: Navigation, app bootstrap, provider setup
- Location: `src/main.tsx`, `src/App.tsx`
- Contains: React Router setup, QueryClient configuration, provider hierarchy
- Depends on: React Router, React Query, Auth context
- Used by: Browser entry point

## Data Flow

**Initial App Load:**

1. `src/main.tsx` renders root app in DOM
2. `src/App.tsx` establishes provider hierarchy (QueryClientProvider → BrowserRouter → AuthProvider → TooltipProvider)
3. `AuthProvider` checks session via Supabase and sets `isReady` flag
4. Routes render protected vs public pages based on `useAuth()` hook
5. Page components call `useLocalStorage()` to load data
6. If user is authenticated and data exists in Supabase, it syncs locally
7. User interactions update localStorage immediately (optimistic)
8. Async sync to Supabase happens via `useLocalStorage` hook callback

**User Authentication:**

1. User navigates to `/login` (lazy-loaded `Login` component)
2. Login form submits credentials to Supabase auth
3. Supabase returns session; `AuthProvider` detects via `onAuthStateChange()`
4. User is stored in context; `isReady` becomes true
5. Protected routes now render; seed data initializes if needed
6. On logout, `signOut()` clears session and redirects to login

**Data Persistence:**

1. Component reads via `useLocalStorage(key, default)` → returns `[data, save]` tuple
2. Component mutates via `save(updatedData)` → updates state immediately
3. `save()` writes to localStorage synchronously
4. Custom event `STORAGE_SYNC_EVENT` fires to notify other components in same tab
5. If `mappedToSupabase[key]` exists, async sync queues to Supabase
6. Page reload: data loads from localStorage first, Supabase overrides if newer

**Search & Navigation:**

1. `GlobalSearch` component indexes all data (orcamentos, notas fiscais, fornecedores, etc.)
2. User types query; search results display with navigation links
3. Click navigates via React Router to page + filters applied
4. `Breadcrumbs` tracks current route and parent navigation

**State Management:**

- **Page State:** Managed via `useLocalStorage()` hooks (mutable via returned `save()` function)
- **Form State:** Managed via component `useState()` with validation via `useFormValidation()` hook
- **Auth State:** Managed in `AuthContext` (global, provided at root)
- **UI State:** Theme stored in localStorage (`obraclinic_theme`), theme toggle in `AppHeader`
- **Query Cache:** React Query manages server data via `QueryClient` (minimal use in current codebase)

## Key Abstractions

**useLocalStorage Hook:**
- Purpose: Unified data access with localStorage + Supabase sync
- Location: `src/hooks/useLocalStorage.ts`
- Pattern: Returns `[data, save]` tuple mimicking `useState` API
- Handles: Auto-hydration, conflict resolution, same-tab sync events
- Example: `const [orcamentos, setOrcamentos] = useLocalStorage<Orcamento[]>('orcamentos', [])`

**AuthContext:**
- Purpose: Global authentication state
- Location: `src/contexts/AuthContext.tsx`
- Provides: `user`, `session`, `loading`, `isReady`, `signOut`
- Pattern: React Context with provider at root of `App.tsx`
- Usage: `const { user, isReady } = useAuth()`

**Type Definitions:**
- Purpose: Centralized domain model definitions
- Location: `src/lib/types.ts`
- Contains: 20+ interfaces (Orcamento, NotaFiscal, Compra, Fornecedor, ContaFinanceira, etc.)
- Pattern: Plain TypeScript interfaces; auto-mapped to database column names via camelCase↔snake_case conversion

**Page Components:**
- Purpose: Route handlers; manage page-level state and layout
- Location: `src/pages/*.tsx`
- Pattern: Named exports (e.g., `export default function Dashboard()`)
- Responsibilities: Fetch data via hooks, handle CRUD operations, render layout with child components
- Lifecycle: Lazy-loaded via React.lazy() in App.tsx routes

**UI Library Components:**
- Purpose: Reusable presentational components
- Location: `src/components/ui/`
- Source: shadcn/ui (Radix UI primitives + Tailwind CSS)
- Pattern: Default exports, composed via props
- Examples: Button, Card, Dialog, Table, Form, etc.

**Utility Functions:**
- Purpose: Shared helper logic
- Location: `src/lib/*.ts`
- Examples: `formatters.ts` (currency, date, percent), `utils.ts`, `ofxParser.ts`, `financialServices.ts`

## Entry Points

**Browser Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser loads HTML; script tag loads main.tsx bundle
- Responsibilities: Restore theme from localStorage, render React app to DOM

**App Component:**
- Location: `src/App.tsx`
- Triggers: Rendered by main.tsx
- Responsibilities: Set up provider hierarchy, define route structure, manage lazy code splitting

**Protected Routes:**
- Location: `src/App.tsx` → `ProtectedRoutes()` component
- Triggers: Only renders if user is authenticated
- Responsibilities: Guard public routes, seed initial data, manage auth loading states

**Page Components:**
- Location: `src/pages/*.tsx`
- Triggers: Route matches (e.g., `/orcamentos` → Orcamentos component)
- Responsibilities: Fetch page-specific data, render page layout, handle CRUD operations

## Error Handling

**Strategy:** Graceful degradation with user feedback via toast notifications

**Patterns:**

- **Auth Errors:** AuthProvider catches Supabase errors; redirects to login
- **Sync Errors:** supabaseSync.ts throttles error toasts (max 1 per 10 seconds); logs full error to console
- **Form Validation:** useFormValidation hook; field errors displayed inline; validateAll() called before submit
- **API Failures:** Try-catch in async operations; fallback to localStorage if Supabase unavailable
- **Missing Data:** Components render EmptyState when data arrays are empty
- **Navigation:** Unmatched routes render NotFound page

**Error Recovery:**

- Sync failures auto-retry on next save (via useLocalStorage hook)
- Form errors prevent submit; user corrects and resubmits
- Auth errors trigger sign-out redirect; user logs back in
- Network timeouts fall back to cached data

## Cross-Cutting Concerns

**Logging:** 
- Pattern: `console.error()` in error paths (supabaseSync, seedData, auth)
- Purpose: Debugging; errors tagged with `[module]` prefix
- Throttled: Sync errors throttled to avoid spam

**Validation:**
- Pattern: Field-level rules in useFormValidation hook
- Applied: Before form submit (validateAll), on field blur, onChange with debounce
- Types: Required, email, CNPJ, number ranges

**Authentication:**
- Pattern: Supabase Auth with persistent session via localStorage
- Applied: AuthProvider wraps entire app; checks session on mount
- Protected: useAuth hook guards data access; seed only runs if user exists
- Logout: signOut() clears session; redirects to login

**Theme/Styling:**
- Pattern: CSS classes via Tailwind CSS; theme toggle stores to localStorage
- Applied: Root component checks `obraclinic_theme` on load; applies class
- Customization: tailwind.config.ts defines design tokens (colors, spacing)

**Notifications:**
- Pattern: Toast notifications via Sonner library
- Applied: Success/error messages on CRUD operations, sync failures, validation errors
- Auto-dismiss: 8 seconds for errors, 3 seconds for success

**State Sync:**
- Pattern: Custom event dispatch (STORAGE_SYNC_EVENT) for same-tab sync
- Applied: useLocalStorage hook listens for events; re-reads localStorage
- Cross-tab: Browser StorageEvent fires automatically on localStorage changes

---

*Architecture analysis: 2026-04-16*
