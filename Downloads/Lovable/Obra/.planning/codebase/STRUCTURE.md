# Codebase Structure

**Analysis Date:** 2026-04-16

## Directory Layout

```
otovision/
├── src/                      # Application source code
│   ├── components/           # React components (core + UI library)
│   │   ├── ui/              # shadcn/ui component library (50+ components)
│   │   ├── AppLayout.tsx    # Root layout wrapper
│   │   ├── AppHeader.tsx    # Top navigation and controls
│   │   ├── AppSidebar.tsx   # Left sidebar navigation
│   │   ├── Breadcrumbs.tsx  # Breadcrumb navigation
│   │   ├── GlobalSearch.tsx # Global search modal
│   │   └── [13 more]        # Other layout and reusable components
│   ├── pages/               # Page/route components (21 pages)
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Orcamentos.tsx   # Budgets
│   │   ├── NotasFiscais.tsx # Invoices
│   │   ├── FluxoCaixa.tsx   # Cash flow
│   │   ├── Fornecedores.tsx # Suppliers
│   │   ├── Compras.tsx      # Purchases
│   │   ├── Cronograma.tsx   # Schedule
│   │   ├── [14 more]        # Other pages
│   │   └── NotFound.tsx     # 404 page
│   ├── hooks/               # Custom React hooks
│   │   ├── useLocalStorage.ts       # Hybrid localStorage + Supabase sync
│   │   ├── useFormValidation.tsx    # Form validation and error handling
│   │   ├── useObraConfig.ts         # Project configuration
│   │   ├── useContasFinanceiras.ts  # Financial accounts
│   │   ├── useTableFeatures.ts      # Export and table utilities
│   │   ├── useNotifications.ts      # Notification management
│   │   ├── useConfirmDialog.tsx     # Confirmation dialogs
│   │   ├── use-mobile.tsx           # Mobile detection
│   │   └── use-toast.ts             # Toast notifications
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── lib/                 # Utility functions and helpers
│   │   ├── types.ts         # Domain model interfaces (20+ types)
│   │   ├── storage.ts       # localStorage API wrapper
│   │   ├── supabaseSync.ts  # Sync logic between localStorage and Supabase
│   │   ├── syncQueue.ts     # Sync operation queue
│   │   ├── formatters.ts    # String formatting (currency, date, percent)
│   │   ├── utils.ts         # General utilities
│   │   ├── seedData.ts      # Demo data initialization
│   │   ├── financialServices.ts    # Financial calculations
│   │   ├── ofxParser.ts     # OFX file parsing
│   │   ├── dedup.ts         # Deduplication utilities
│   │   └── vite-env.d.ts    # Vite environment types
│   ├── integrations/        # External service integrations
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client initialization
│   │       └── types.ts     # Generated database types
│   ├── test/                # Test files
│   │   ├── setup.ts         # Vitest configuration
│   │   └── example.test.ts  # Example test
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   └── vite-env.d.ts        # Type definitions
├── public/                  # Static assets
├── supabase/                # Supabase configuration and migrations
├── dist/                    # Build output (generated)
├── node_modules/            # Dependencies (generated)
├── .lovable/                # Lovable AI configuration
├── .git/                    # Git repository
├── components.json          # shadcn/ui configuration
├── eslint.config.js         # ESLint rules
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── playwright.config.ts     # Playwright E2E test configuration
├── package.json             # Dependencies and scripts
├── README.md                # Project documentation
└── index.html               # HTML entry point
```

## Directory Purposes

**src/**
- Purpose: All application source code
- Contains: Components, pages, hooks, utilities, types
- Key pattern: Index-free; direct file imports via @ path alias

**src/components/**
- Purpose: React components divided into presentational and layout tiers
- Contains: 61 total files (50 UI library components + 13 core components)
- Key files: `AppLayout.tsx` (root layout), `AppSidebar.tsx` (navigation), `AppHeader.tsx` (header with theme/backup controls)

**src/components/ui/**
- Purpose: Shadcn/ui component library for consistent design
- Contains: 50+ components (Button, Card, Dialog, Table, Form, Select, etc.)
- Pattern: Each component is a .tsx file exporting a single component
- Usage: Imported and composed in pages and core components

**src/pages/**
- Purpose: Page-level components that map to routes
- Contains: 21 page components
- Pattern: Default export function; named after route (e.g., Fornecedores → `/fornecedores`)
- Responsibilities: Fetch data, manage form state, handle CRUD operations

**src/hooks/**
- Purpose: Custom React hooks for state management and business logic
- Contains: 9 hook files
- Key hooks:
  - `useLocalStorage.ts`: Core data persistence with Supabase sync
  - `useFormValidation.tsx`: Field validation and error display
  - `useObraConfig.ts`: Project config management
  - `useTableFeatures.ts`: CSV/PDF export utilities

**src/contexts/**
- Purpose: React Context providers for global state
- Contains: AuthContext for authentication
- Pattern: Context + Hook (useAuth) for access

**src/lib/**
- Purpose: Pure utility functions, type definitions, and data access logic
- Contains: 10 files
- Key files:
  - `types.ts`: All domain model interfaces
  - `storage.ts`: localStorage key mapping
  - `supabaseSync.ts`: Sync engine between localStorage and Supabase
  - `formatters.ts`: String formatting functions

**src/integrations/supabase/**
- Purpose: Encapsulate Supabase client and database types
- Contains: Client initialization, auto-generated database types
- Pattern: Single client instance exported from client.ts

**src/test/**
- Purpose: Unit and integration tests
- Contains: Vitest configuration and example tests
- Pattern: Tests use .test.ts extension

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app bootstrap; renders App to DOM
- `src/App.tsx`: Route definitions, provider setup, lazy component loading
- `index.html`: HTML shell with root div

**Configuration:**
- `vite.config.ts`: Build configuration, @ path alias
- `tsconfig.json`: TypeScript paths, strict options
- `tailwind.config.ts`: Design tokens (colors, spacing, fonts)
- `eslint.config.js`: Linting rules
- `package.json`: Dependencies, build scripts

**Core Logic:**
- `src/contexts/AuthContext.tsx`: Authentication state and Supabase session
- `src/hooks/useLocalStorage.ts`: Data persistence orchestration
- `src/lib/storage.ts`: localStorage key naming and access
- `src/lib/supabaseSync.ts`: Sync engine implementation
- `src/lib/types.ts`: Domain model definitions

**Testing:**
- `src/test/setup.ts`: Vitest configuration
- `src/test/example.test.ts`: Example unit test
- `playwright.config.ts`: E2E test configuration

## Naming Conventions

**Files:**
- PascalCase for React components (e.g., `Dashboard.tsx`, `AppLayout.tsx`)
- camelCase for utility/hook modules (e.g., `useLocalStorage.ts`, `formatters.ts`)
- lowercase for config files (e.g., `vite.config.ts`, `tailwind.config.ts`)
- index-free imports (no barrel files; import from specific files)

**Directories:**
- lowercase plural for feature directories (e.g., `components/`, `pages/`, `hooks/`)
- lowercase singular for util modules (e.g., `lib/`, `test/`)
- lowercase plural for UI subdir (e.g., `ui/`)

**Functions:**
- camelCase for all functions (e.g., `formatCurrency()`, `loadData()`)
- useXxx pattern for all custom hooks (e.g., `useLocalStorage()`, `useFormValidation()`)
- SCREAMING_SNAKE_CASE for constants (e.g., `CATEGORIAS_PADRAO`, `PASTAS_ARQUIVO`)

**Variables:**
- camelCase for all variables and state (e.g., `orcamentos`, `setFornecedores`)
- Prefixed with $ for DOM elements (informal; not enforced)
- Prefixed with is/has for booleans (e.g., `isReady`, `hasMappings`)

**Types/Interfaces:**
- PascalCase for all types (e.g., `Orcamento`, `Fornecedor`, `ContaFinanceira`)
- T prefix omitted (TypeScript convention not fully applied)
- Interfaces preferred over types
- Database entity types suffixed with their name (e.g., `TransacaoFluxo`, `RegistroDiario`)

**Storage Keys:**
- camelCase in TypeScript code (e.g., `useLocalStorage('orcamentos', [])`)
- Map to snake_case in localStorage (via KEYS object in storage.ts)
- Prefixed with `obraclinic_` in actual storage (e.g., `obraclinic_orcamentos`)

## Where to Add New Code

**New Page/Feature:**
1. Create page component in `src/pages/PageName.tsx`
2. Add route in `src/App.tsx` in ProtectedRoutes section
3. Add type in `src/lib/types.ts` if needed
4. Create custom hook in `src/hooks/usePageName.ts` if state management needed
5. Add storage key in `src/lib/storage.ts` KEYS object
6. Add navigation link in `src/components/AppSidebar.tsx`

**New Component (non-UI):**
1. Create in `src/components/ComponentName.tsx`
2. Import and use in page or other components
3. Add types to `src/lib/types.ts` if component accepts domain data
4. Keep styling in Tailwind classes (no separate CSS files)

**New Utility Function:**
1. Add to appropriate file in `src/lib/`:
   - String/number formatting → `formatters.ts`
   - Data transformation → `utils.ts`
   - Business logic → domain-specific file (e.g., `financialServices.ts`)
   - Storage → `storage.ts`
2. Export and import where needed

**New Hook:**
1. Create in `src/hooks/useHookName.ts`
2. Export hook function and any types it uses
3. Use in components via `const [state, setState] = useHookName()`

**New UI Component (shadcn/ui):**
1. Use CLI: `npx shadcn-ui@latest add [component-name]`
2. Components auto-added to `src/components/ui/`
3. Import and use in other components

**New Test:**
1. Create `.test.ts` or `.test.tsx` file in `src/test/`
2. Import testing libraries from setup.ts
3. Run via `npm test` or `npm run test:watch`

**New Integration/API:**
1. Create directory in `src/integrations/ServiceName/`
2. Add client initialization file (e.g., `client.ts`)
3. Add type definitions file (e.g., `types.ts`)
4. Export from index (or directly import in hooks)

## Special Directories

**node_modules/**
- Purpose: Installed npm dependencies
- Generated: Yes (run `npm install`)
- Committed: No (.gitignore)
- Size: Large; contains 1000+ packages

**dist/**
- Purpose: Compiled JavaScript and assets for production
- Generated: Yes (run `npm run build`)
- Committed: No (.gitignore)
- Input: All of src/ + public/

**.lovable/**
- Purpose: Lovable AI configuration and metadata
- Generated: Yes (by Lovable AI during edits)
- Committed: Unclear (project-specific)

**supabase/**
- Purpose: Supabase project configuration and migrations
- Generated: Partly (migrations auto-created)
- Committed: Yes (tracked in git)
- Contains: SQL migrations, secrets configuration

**.git/**
- Purpose: Git version control
- Committed: System; not source files
- Branch: Currently on `changes` branch; main branch is `v8.11`

## Build & Development Setup

**Development Server:**
```bash
npm run dev
# Starts Vite on http://localhost:8080
# HMR enabled; changes hot-reload instantly
```

**Production Build:**
```bash
npm run build
# Outputs to dist/
# Minified; optimized for production
```

**Testing:**
```bash
npm test              # Run all tests once
npm run test:watch   # Run tests in watch mode
```

**Linting:**
```bash
npm run lint
# Checks .ts and .tsx files
# ESLint rules defined in eslint.config.js
```

---

*Structure analysis: 2026-04-16*
