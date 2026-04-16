# Testing Patterns

**Analysis Date:** 2026-04-16

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`
- Environment: jsdom (browser simulation)
- Globals: true (global test functions available without imports)

**Assertion Library:**
- Vitest's built-in expect API (compatible with Jest assertions)
- Testing Library assertions via `@testing-library/jest-dom` (v6.6.0)

**Run Commands:**
```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode for development
```

**Config Location:**
`/c/Users/Machado/Downloads/Lovable/Obra/otovision/vitest.config.ts`

## Test File Organization

**Location:**
- Tests are co-located with source code or in a `src/test/` directory
- Test files use `.test.ts` or `.spec.ts` extensions

**Naming:**
- Pattern: `*.test.ts`, `*.spec.ts`
- Example: `example.test.ts`

**Directory Structure:**
```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   └── example.test.ts   # Example test file
└── [other directories with inline tests]
```

**Setup Files:**
- Location: `src/test/setup.ts`
- Runs before all tests
- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks window.matchMedia for CSS media queries

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest";

describe("feature name", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
  
  it("should handle edge case", () => {
    // test logic
  });
});
```

**Patterns:**
- Suite organization: Use `describe()` blocks for logical grouping
- Test definition: Use `it()` function (vi-style, similar to Jest's describe/test pattern)
- Assertion style: Direct `expect()` calls with matcher methods

## Setup and Teardown

**Global Setup:**
- `setupFiles: ["./src/test/setup.ts"]` in vitest config
- Setup file configures:
  - Jest DOM matchers via `@testing-library/jest-dom`
  - Window.matchMedia mock (essential for Radix UI and component libraries)

**Per-Test Setup:**
- No explicit beforeEach/afterEach observed in sample test
- Vitest automatically handles cleanup between tests
- Module imports fresh for each test

## Mocking

**Framework:** Vitest has built-in mocking via `vi` object

**What's Mocked:**
- Window APIs (e.g., `window.matchMedia`)
- DOM methods can be mocked as needed
- Module mocking available via `vi.mock()` (not shown in samples but standard pattern)

**Current Mock Example from `setup.ts`:**
```typescript
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

**What to Mock:**
- Browser APIs (matchMedia, localStorage, sessionStorage, fetch)
- External API calls
- Supabase client in unit tests
- window/document methods

**What NOT to Mock:**
- React components (test real component behavior)
- Custom hooks (test their actual logic)
- Date/time functions (use real dates unless testing specific time scenarios)

## Fixtures and Factories

**Test Data:**
- No dedicated fixture files found in codebase yet
- Recommend creating factory functions if needed:

```typescript
// Example pattern (to follow)
const createMockObraConfig = (overrides?: Partial<ObraConfig>): ObraConfig => ({
  nomeObra: 'Test Obra',
  endereco: '123 Test St',
  dataInicio: '2024-01-01',
  dataTermino: '2024-12-31',
  orcamentoTotal: 100000,
  categorias: ['Elétrica', 'Hidráulica'],
  formasPagamento: ['PIX', 'Boleto'],
  ...overrides,
});

const createMockFornecedor = (overrides?: Partial<Fornecedor>): Fornecedor => ({
  id: crypto.randomUUID(),
  nome: 'Test Supplier',
  cnpj: '12345678000190',
  responsavel: 'John Doe',
  telefone: '11999999999',
  email: 'test@test.com',
  especialidade: 'Elétrica',
  endereco: '123 Test St',
  avaliacao: 5,
  status: 'Ativo',
  observacoes: '',
  totalGasto: 0,
  ...overrides,
});
```

**Location:**
- Should be created in `src/test/fixtures/` or similar
- Import in test files as needed

## Coverage

**Requirements:** No coverage requirements enforced (not detected in config)

**Observation:** Only one example test file present — coverage metrics not established

**Recommendation:** 
- Aim for at least 80% coverage on utilities and hooks
- Aim for 60% coverage on UI components (hard to achieve due to React complexity)
- Coverage command can be added: `npx vitest run --coverage`

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, hooks
- Approach: Test with `expect()` assertions
- Current example: `example.test.ts` (basic structure shown)
- Should test: Utility functions in `lib/`, custom hooks, type validators

**Integration Tests:**
- Scope: Multiple components or services working together
- Approach: Test React components with Testing Library
- Should test: Hook integrations with context, component interactions
- Not yet implemented but recommended for:
  - `useLocalStorage` with storage layer
  - `AuthProvider` with Supabase client
  - Form components with validation

**E2E Tests:**
- Framework: Playwright 1.57.0 (in devDependencies)
- Current status: Not yet implemented
- Recommended for: Complete user flows (login → create item → verify in list)
- Config location: Would be at `playwright.config.ts` (not yet present)

## React Component Testing

**Testing Library Integration:**
- `@testing-library/react` v16.0.0 installed
- Supports rendering and querying components
- Use with `vitest` for assertions

**Example pattern (to follow):**
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Common Test Patterns

**Async Testing:**
```typescript
it("should load data", async () => {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve("data"), 100);
  });
  
  const result = await promise;
  expect(result).toBe("data");
});
```

**Hook Testing (needs testing-library hooks package):**
```typescript
import { renderHook } from "@testing-library/react";

it("should return initial value", () => {
  const { result } = renderHook(() => useLocalStorage("key", {}));
  expect(result.current[0]).toEqual({});
});
```

**Error Testing:**
```typescript
it("should throw on invalid input", () => {
  expect(() => {
    // Code that should throw
  }).toThrow("Expected error message");
});
```

## Test Configuration Details

**vitest.config.ts Settings:**
```typescript
export default defineConfig({
  plugins: [react()],        // React component support
  test: {
    environment: "jsdom",    // Browser environment
    globals: true,           // Global test functions (describe, it, expect)
    setupFiles: ["./src/test/setup.ts"],  // Run setup before tests
    include: ["src/**/*.{test,spec}.{ts,tsx}"],  // Test file patterns
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },  // Path alias
  },
});
```

## Coverage Metrics (Recommended Targets)

- **Utilities** (`src/lib/`): 80%+ coverage (formatters, validators, helpers)
- **Hooks** (`src/hooks/`): 70%+ coverage (focus on state logic)
- **Components** (`src/components/`): 50-60% coverage (UI components are harder to test)
- **Contexts** (`src/contexts/`): 70%+ coverage (test provider behavior)

## To Add Tests

**Priority areas:**
1. `src/lib/formatters.ts` — Simple pure functions, easy to test
2. `src/lib/types.ts` — Type definitions and constants validation
3. `src/hooks/useLocalStorage.ts` — Complex hook with storage logic
4. `src/hooks/useFormValidation.tsx` — Form validation patterns
5. `src/contexts/AuthContext.tsx` — Auth provider behavior

**Next Steps:**
- Create test files alongside each utility
- Use `describe()` blocks to organize tests by function
- Mock external dependencies (Supabase, localStorage)
- Run `npm run test:watch` during development

---

*Testing analysis: 2026-04-16*
