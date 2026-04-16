# Technology Stack

**Analysis Date:** 2026-04-16

## Languages

**Primary:**
- TypeScript 5.8.3 - All source code and configuration files
- JavaScript (implicit via TypeScript) - ESLint and Vite configs
- CSS/Tailwind - Styling via Tailwind CSS 3.4.17

**Secondary:**
- JSX/TSX - React component definitions

## Runtime

**Environment:**
- Node.js 24.14.1

**Package Manager:**
- npm - Manages dependencies
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- React 18.3.1 - UI library for building components
- React Router DOM 6.30.1 - Client-side routing

**UI Component Libraries:**
- Radix UI - Headless component primitives
  - Versions: 1.1.x - 2.2.x across 20+ component packages (@radix-ui/react-*)
- shadcn/ui - Component library built on Radix UI (via component files)
- Lucide React 0.462.0 - Icon library
- Embla Carousel React 8.6.0 - Carousel component
- Next Themes 0.3.0 - Dark mode theme management

**Form & Validation:**
- React Hook Form 7.61.1 - Form state management
- Zod 3.25.76 - Schema validation
- @hookform/resolvers 3.10.0 - Form validation resolvers

**Data Management:**
- TanStack React Query 5.83.0 - Server state management and caching
- Supabase JS Client 2.103.2 - Backend database and authentication

**Utilities & Formatting:**
- Date-fns 3.6.0 - Date manipulation
- Clsx 2.1.1 - Conditional CSS class builder
- Tailwind Merge 2.6.0 - Merge Tailwind CSS classes
- Class Variance Authority 0.7.1 - CSS-in-JS utility for component variants
- cmdk 1.1.1 - Command menu/search
- Sonner 1.7.4 - Toast notifications
- Vaul 0.9.9 - Drawer/dialog component
- Input OTP 1.4.2 - One-time password input
- React Day Picker 8.10.1 - Calendar date picker
- React Resizable Panels 2.1.9 - Resizable layout panels
- Recharts 2.15.4 - Data visualization charts

**Testing:**
- Vitest 3.2.4 - Unit test runner
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.6.0 - Jest matchers for DOM
- jsdom 20.0.3 - DOM emulation for testing

**Build/Dev:**
- Vite 5.4.19 - Build tool and dev server
- @vitejs/plugin-react-swc 3.11.0 - Vite plugin for React with SWC compilation
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS transformation tool
- Autoprefixer 10.4.21 - Adds vendor prefixes to CSS
- @tailwindcss/typography 0.5.16 - Tailwind typography plugin

**Code Quality:**
- ESLint 9.32.0 - Linter for code quality
- @eslint/js 9.32.0 - ESLint core configuration
- typescript-eslint 8.38.0 - TypeScript support for ESLint
- eslint-plugin-react-hooks 5.2.0 - Rules for React hooks
- eslint-plugin-react-refresh 0.4.20 - Rules for Vite React Fast Refresh

**Custom Tools:**
- lovable-tagger 1.1.13 - Component tagging/identification tool for development

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.103.2 - Backend database, authentication, and real-time functionality
- @tanstack/react-query 5.83.0 - Server state management, caching, and synchronization
- React 18.3.1 - UI rendering engine

**Infrastructure:**
- Vite 5.4.19 - Fast build tool and dev server with HMR
- TypeScript 5.8.3 - Type safety and developer experience

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env` prefix (VITE_*)
- Required environment variables:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous/public key
  - `VITE_SUPABASE_PROJECT_ID` - Supabase project identifier

**Build:**
- `vite.config.ts` - Vite build configuration
  - React via SWC compilation
  - Path alias: `@` → `./src`
  - Server: runs on port 8080
  - HMR overlay disabled
  - Component deduplication for React Query and React DOM
- `tailwind.config.ts` - Tailwind CSS customization
  - Dark mode via class strategy
  - Custom colors: primary, secondary, destructive, muted, accent, success, warning, info, sidebar variants
  - Custom animations: accordion, pulse-glow, slide-in, fade-in-up, scale-in, slide-in-left
- `tsconfig.json` - TypeScript configuration
  - ECMAScript 2020
  - Path mapping for `@/*` imports
  - Loose type checking (allowJs, noImplicitAny: false)
- `postcss.config.js` - PostCSS configuration for Tailwind CSS
- `eslint.config.js` - ESLint configuration with React hooks and refresh rules

## Platform Requirements

**Development:**
- Node.js 24.14.1 or compatible
- npm for dependency management
- Any modern browser with ES2020 support
- System capable of running Vite dev server

**Production:**
- Static hosting (any CDN or web server)
- Supabase account and project
- Browser support: ES2020 compatible browsers (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+)

---

*Stack analysis: 2026-04-16*
