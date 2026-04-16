# Coding Conventions

**Analysis Date:** 2026-04-16

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `AppHeader.tsx`, `ItemsTableEditor.tsx`)
- Utilities and hooks: camelCase with descriptive names (e.g., `formatters.ts`, `useLocalStorage.ts`)
- UI components: lowercase with hyphens (e.g., `accordion.tsx`, `carousel.tsx`) — located in `src/components/ui/`
- Context files: Named after their context (e.g., `AuthContext.tsx`)
- Type definition files: `types.ts` for all type declarations

**Functions:**
- camelCase for all function declarations: `formatCurrency()`, `calcTimeProgress()`, `seedIfNeeded()`
- Custom hook functions: camelCase prefixed with `use` (e.g., `useLocalStorage`, `useAuth`, `useFormValidation`)
- Event handlers: prefixed with `on` or `handle` (e.g., `onClick={handleBackup}`, `onChange={handleSync}`)
- Helper functions in components: lowercase or camelCase, often defined inline (e.g., `emptyItem()`, `update()`, `add()`)

**Variables:**
- camelCase for all variables and state (e.g., `config`, `fluxo`, `totalGasto`, `isHydrated`)
- Boolean variables prefixed with `is`, `has`, or similar (e.g., `isReady`, `isHydrated`, `hasMapping`, `hasLocalData`)
- Constants that are object/array literals: camelCase (e.g., `lastSaveTimeMap`)
- Exported constants: UPPER_SNAKE_CASE (e.g., `STORAGE_SYNC_EVENT`, `CATEGORIAS_PADRAO`, `FORMAS_PAGAMENTO_PADRAO`, `PASTAS_ARQUIVO`)

**Types/Interfaces:**
- PascalCase for all types and interfaces (e.g., `ObraConfig`, `Fornecedor`, `ItemOrcamento`, `AuthContextType`)
- Prefix with descriptive domain (e.g., `HistoricoStatus`, `TransacaoFluxo`, `RegistroDiario`, `MedicaoItem`)

## Code Style

**Formatting:**
- Prettier integration (referenced in package.json but no `.prettierrc` file found)
- Indentation: 2 spaces (evident from code style)
- Line length: No strict limit observed, but code tends to wrap around 100-120 characters
- Semicolons: Always present at end of statements
- Quotes: Single quotes preferred for strings and JSX (e.g., `import { Button } from '@/components/ui/button'`)

**Linting:**
- ESLint configuration: `eslint.config.js` at project root
- Base configs: `@eslint/js` recommended + TypeScript ESLint recommended
- Key rules disabled: `@typescript-eslint/no-unused-vars` set to `"off"` (unused variables not enforced)
- React hooks rules enabled: `react-hooks/recommended` enforced
- React refresh: Only warns (not errors) on non-component exports with constant export allowed

**TypeScript Settings:**
- `strictNullChecks: false` — null/undefined not strictly enforced
- `noImplicitAny: false` — implicit any allowed
- `noUnusedLocals: false` — unused locals not checked
- `noUnusedParameters: false` — unused parameters allowed
- `allowJs: true` — JavaScript files allowed
- Path aliases configured: `@/*` resolves to `./src/*`

## Import Organization

**Order:**
1. React and core library imports (React, hooks, types from react)
2. Third-party libraries (@tanstack, @radix-ui, date-fns, etc.)
3. Internal utilities and types (@/lib/*, @/integrations/*)
4. Internal components (@/components/*)
5. Internal hooks (@/hooks/*)
6. Context providers (@/contexts/*)
7. Styling and icons (lucide-react, sonner, CSS imports)

**Example from `AppHeader.tsx`:**
```typescript
import { CalendarDays, Search, Download } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { ObraConfig, TransacaoFluxo } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { exportAllData } from '@/lib/storage';
import { toast } from 'sonner';
```

**Path Aliases:**
- `@/*` → resolves to `./src/*`
- All imports from within src use `@/` prefix (e.g., `@/components/ui/button`, `@/lib/types`)

## Error Handling

**Patterns:**
- Try/catch blocks used for async operations and file operations (e.g., `AppHeader.tsx` handleBackup function)
- Error logging: Console errors with descriptive context (e.g., `console.error("[seed] failed to initialize demo data:", error)`)
- User-facing errors: Displayed via toast notifications (e.g., `toast.error('Erro ao gerar backup')`)
- Catch clauses: Often silent (empty catch blocks) with `.catch()` methods on Promises
- Cancellation flags: Used in async contexts to prevent state updates after unmount (e.g., `let cancelled = false` in useEffect cleanup)

**Example pattern from `useLocalStorage.ts`:**
```typescript
loadFromSupabase(key, user.id)
  .then(result => {
    if (cancelled) return;
    // process result
  })
  .catch(() => {
    if (!cancelled) setData(cached);
  })
  .finally(() => {
    if (!cancelled) setIsHydrated(true);
  });
```

## Logging

**Framework:** Console methods (no dedicated logging library)

**Patterns:**
- `console.error()` for errors with prefixed context labels (e.g., `console.error("[seed] ...")`, `console.error('[useContasFinanceiras] migration error', e)`)
- No debug logs visible in production code
- Labels in brackets help identify which part of the system logged the message

**Example:**
```typescript
console.error("[seed] failed to initialize demo data:", error);
console.error('[useContasFinanceiras] migration error', e);
```

## Comments

**When to Comment:**
- Complex calculations or business logic get brief comments
- Module-level comments for important patterns (e.g., Module-level map comment in `useLocalStorage.ts`)
- No extensive JSDoc comments observed in sample files
- Inline comments for non-obvious algorithmic decisions

**JSDoc/TSDoc:**
- Not consistently used across the codebase
- Type annotations preferred over TSDoc comments
- Function signatures clearly document types without additional comments needed

## Function Design

**Size:** 
- Functions tend to be under 50 lines
- Complex logic split across multiple functions
- Handler functions often 10-20 lines

**Parameters:**
- Props objects destructured in function signatures (e.g., `function AppHeader()` with hooks inside)
- Component props defined as TypeScript interfaces (e.g., `interface Props { itens: ItemOrcamento[]; onChange: (itens: ItemOrcamento[]) => void; }`)
- Callbacks passed as `onChange`, `onClick` props with clear naming

**Return Values:**
- Components return JSX elements wrapped in fragments when needed
- Hooks return tuples or single values (e.g., `useLocalStorage` returns `[data, save] as const`)
- Pure functions return computed values without side effects

## Module Design

**Exports:**
- Named exports for utility functions (e.g., `export function formatCurrency()`)
- Default exports for React components (e.g., `export default App`)
- Barrel exports common in UI component directory (e.g., `components/ui/` re-exports commonly used shadcn components)
- Context exports both Provider component and hook (e.g., `AuthProvider` and `useAuth`)

**Barrel Files:**
- Used in `src/components/ui/` for exported UI primitives
- Simplifies imports: `import { Button } from '@/components/ui/button'`

## File Structure within Components

**React Component Pattern:**
```typescript
// 1. Imports organized
// 2. Type definitions / Interfaces
interface Props { ... }

// 3. Helper functions (if any)
const emptyItem = (): ItemOrcamento => ({ ... });

// 4. Component function
export function ComponentName(props) {
  // Hooks first
  const [state, setState] = useState();
  const { data } = useContext();
  
  // Handlers
  const handleClick = () => { ... };
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Render
  return ( ... );
}
```

## Consistency Patterns

**Destructuring:** Preferred over dot notation in imports and component props
**Arrow Functions:** Used for callbacks and handlers (e.g., `onClick={() => remove(idx)}`)
**Ternary Operators:** Used for conditional rendering (e.g., `{time.percent > 0 && (...)}`
**Template Literals:** For dynamic string concatenation (e.g., dynamic class names, file names)
**Classname Utilities:** `clsx` used for conditional class composition

---

*Convention analysis: 2026-04-16*
