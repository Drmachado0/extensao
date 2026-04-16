# Codebase Concerns

**Analysis Date:** 2026-04-16

## Tech Debt

**Large Component Files:**
- Issue: Multiple page components exceed 700+ lines, combining state management, business logic, UI rendering, and form handling in single files
- Files: `src/pages/Orcamentos.tsx` (977 lines), `src/pages/LeitorIA.tsx` (822 lines), `src/pages/FluxoCaixa.tsx` (764 lines), `src/pages/NotasFiscais.tsx` (712 lines)
- Impact: Difficult to test, hard to maintain, complex refactoring, reduced code reusability
- Fix approach: Extract business logic into custom hooks, separate form components from data management, create smaller presentational components

**Type Safety Gaps:**
- Issue: Dynamic type casting to work around Supabase's strict table name requirements uses `as unknown as` pattern
- Files: `src/lib/supabaseSync.ts` (lines 20-23)
- Impact: Loss of IDE autocomplete, hidden type errors at runtime, difficult to refactor database operations
- Fix approach: Generate typed Supabase client wrapper or use discriminated unions for table operations

**Loose Error Handling in Storage:**
- Issue: `saveData()` in `src/lib/storage.ts` (line 35) silently fails if JSON serialization throws; no error boundary or logging
- Files: `src/lib/storage.ts`, `src/hooks/useFormValidation.tsx` (lines 92-96)
- Impact: Silent data loss when localStorage quota exceeded or in private browsing mode; draft auto-saves fail silently
- Fix approach: Add try-catch with user notification, implement graceful degradation, monitor storage quota

**Async/Await Race Conditions:**
- Issue: LeitorIA PDF processing uses 60-second hard timeout with Promise.race() but doesn't cancel the actual PDF processing
- Files: `src/pages/LeitorIA.tsx` (lines 330, 271-287)
- Impact: Orphaned PDF worker processes, memory leaks if user cancels during processing, inconsistent state if timeout fires mid-operation
- Fix approach: Use AbortController for PDF conversion, implement proper cleanup for canvas contexts

## Performance Bottlenecks

**Inefficient Dashboard Calculations:**
- Problem: Dashboard performs multiple full array passes for different calculations (trends, expense by category, etc) on every render
- Files: `src/pages/Dashboard.tsx` (lines 90-149)
- Current: unoptimized with ~15 separate filter/reduce operations on same data
- Improvement path: Consolidate into single pass with index building, memoize category map computation, batch date calculations

**Large PDF Processing:**
- Problem: Converts full PDF (up to 5 pages) to base64 images in memory before sending to Supabase function
- Files: `src/pages/LeitorIA.tsx` (lines 271-287)
- Cause: `canvas.toDataURL()` creates massive strings, no chunking or streaming
- Improvement path: Send pages sequentially, implement server-side PDF processing instead of client-side conversion

**Debounced Sync Without Batching:**
- Problem: Each data change triggers 800ms debounce timer; rapid changes create many upsert calls
- Files: `src/lib/supabaseSync.ts` (lines 262-279)
- Cause: Debounce at component level, not at sync level; no request batching for related entities
- Improvement path: Batch syncs by entity type, implement request coalescing, add exponential backoff

## Fragile Areas

**LocalStorage as Primary Data Store:**
- Files: `src/lib/storage.ts`, `src/hooks/useLocalStorage.ts`
- Why fragile: localStorage has 5-10MB limit (varies by browser), silently fails on quota exceeded, no versioning for data migration, data persists across clears
- Safe modification: Add storage quota checking before save, implement data archiving for old records, add schema versioning with migration functions
- Test coverage: Only one test file (`src/test/example.test.ts`), no storage interaction tests

**Supabase Sync Complexity:**
- Files: `src/lib/supabaseSync.ts` (447 lines)
- Why fragile: Multiple layers of conversion (camelCase ↔ snake_case), dynamic column mapping, complex null/default handling, assumes database schema won't change
- Safe modification: Keep schema in sync with E[] config, add TypeScript generation from Supabase schema, test migrations before production
- Test coverage: No unit tests for sync functions; only integration via app

**Extrato Reconciliation Logic:**
- Files: `src/pages/LeitorIA.tsx` (lines 105-130)
- Why fragile: Date matching uses 2-day window (hardcoded), amount matching uses 0.01 tolerance, no deduplication, can create false matches
- Safe modification: Make tolerances configurable, add weight scoring for matches, prevent duplicate reconciliation, test with various bank formats
- Test coverage: No tests for reconciliation logic

**OFX/CSV Parser Edge Cases:**
- Files: `src/lib/ofxParser.ts`
- Why fragile: Regex-based parsing relies on specific XML/SGML formatting, no validation of parsed amounts, silent skips on malformed lines
- Safe modification: Add logging for skipped records, validate amount/date before acceptance, test with multiple bank formats
- Test coverage: No tests; parser used directly in production

## Security Considerations

**Client-Side Data Exposure:**
- Risk: All financial data (amounts, account numbers, transactions) stored unencrypted in localStorage
- Files: `src/lib/storage.ts`, entire localStorage strategy
- Current mitigation: Supabase RLS policies (server-side), localStorage accessible to any XSS attack
- Recommendations: Add client-side encryption layer, implement content security policy headers, sanitize XSS vectors in AI output, audit third-party dependencies

**Type Casting Bypasses:**
- Risk: `as unknown as` patterns in `src/lib/supabaseSync.ts` hide type mismatches that could lead to SQL injection via dynamic columns
- Files: `src/lib/supabaseSync.ts` (lines 20-23)
- Current mitigation: Database table whitelist in E[] config, column names hardcoded
- Recommendations: Generate types from Supabase schema instead of manual mapping, validate column names against schema

**Unvalidated AI Output:**
- Risk: LeitorIA accepts unvalidated data from Supabase function and directly creates database records
- Files: `src/pages/LeitorIA.tsx` (lines 361-387, 389-414)
- Current mitigation: User review before creation, but easy to miss errors
- Recommendations: Add schema validation with Zod, implement sanity checks on extracted amounts, log all AI-extracted data

**Sensitive Data in Error Logs:**
- Risk: Error handling in supabaseSync includes console.error with full error objects
- Files: `src/lib/supabaseSync.ts` (lines 49-55)
- Current mitigation: Development only, but can leak in production if not properly configured
- Recommendations: Filter sensitive fields before logging, use structured logging, implement audit trail for data access

## Scaling Limits

**LocalStorage Capacity:**
- Current capacity: ~5-8MB per origin (browser-dependent)
- Limit: With current data model (100 invoices × 2KB each, plus transactions, quotes) reaches ~40% capacity at moderate usage
- Scaling path: Implement data archiving, add pagination/lazy loading, migrate cold data to server, implement IndexedDB for larger datasets

**Database Operations on Arrays:**
- Current: Full array upsert per sync (500-item chunking)
- Limit: N+1 queries if syncing many small arrays frequently, no batch operation optimization
- Scaling path: Batch by entity type, implement server-side triggers for dependent updates, add read replicas

## Missing Critical Features

**No Offline Support:**
- Problem: Sync fails when network is unavailable; user changes are queued but no UI indicator
- Blocks: Construction teams working in remote locations, confidence in data saves
- Recommendation: Implement service worker, add sync status indicator, queue operations with retry UI

**No Data Archiving/Retention Policy:**
- Problem: Old data accumulates in localStorage indefinitely; no export of historical records
- Blocks: Long-running projects, compliance with data lifecycle policies
- Recommendation: Implement monthly archive exports, add soft-delete with retention periods

**No Concurrent Editor Handling:**
- Problem: If same project opened in multiple tabs, last write wins; no merge or conflict resolution
- Blocks: Teams editing same data, mobile + desktop simultaneously
- Recommendation: Add timestamps to track last modified, implement client-side conflict detection, show stale data warnings

**No Input Validation Framework:**
- Problem: No centralized validation; each component has ad-hoc validation or none
- Blocks: Data quality assurance, API contract enforcement
- Recommendation: Use Zod throughout, create validation schemas for each entity, add pre-save validation

## Test Coverage Gaps

**Integration Tests Missing:**
- What's not tested: Supabase sync flow, localStorage ↔ Supabase round-trip, auth transitions
- Files: `src/lib/supabaseSync.ts`, `src/contexts/AuthContext.tsx`, `src/hooks/useLocalStorage.ts`
- Risk: Silent sync failures, data loss on auth state changes, hydration mismatches
- Priority: High

**Component Tests Missing:**
- What's not tested: Complex pages (Orcamentos, LeitorIA, Dashboard), form interactions, error states
- Files: `src/pages/*.tsx`
- Risk: Breaking changes in refactoring, accessibility issues, UX regressions
- Priority: High

**Parser Tests Missing:**
- What's not tested: OFX parsing edge cases, CSV format variations, reconciliation logic
- Files: `src/lib/ofxParser.ts`, `src/pages/LeitorIA.tsx` (reconciliation)
- Risk: Silent failures with malformed files, incorrect reconciliation matching
- Priority: Medium

**Type Coverage:**
- What's not tested: Generic Record<string, unknown> patterns in sync layer, dynamic column access
- Files: `src/lib/supabaseSync.ts` (entire type system)
- Risk: Runtime errors from malformed data
- Priority: Medium

## Dependencies at Risk

**Deprecated Pattern: jsPDF + pdfjs-dist:**
- Risk: Maintaining two separate PDF libraries creates confusion; pdfjs-dist (4.4.168) is large
- Current: jsPDF for export, pdfjs-dist for import/parsing
- Impact: Large bundle size, duplicate functionality
- Migration plan: Consider using pdfjs-dist exclusively with custom render layer, or migrate to lighter server-side solution

**Supabase SDK Migration Path:**
- Risk: @supabase/supabase-js 2.100.1 is stable but will eventually require v3 migration
- Current: Heavy type casting to bypass strict typing; migration will be painful
- Impact: Breaking changes when upgrading
- Migration plan: Fix type casting now before major upgrade, generate types from schema

---

*Concerns audit: 2026-04-16*
