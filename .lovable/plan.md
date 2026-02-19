
# Diagnóstico e Correção: Warning forwardRef + Tela Branca

## Problema 1: Warning `forwardRef` no Skeleton

O console mostra claramente:
```
Warning: Function components cannot be given refs.
Check the render method of `Targets`.
  at Skeleton (src/components/ui/skeleton.tsx:22:21)
```

O componente `Skeleton` em `src/components/ui/skeleton.tsx` é uma função comum sem `forwardRef`:
```tsx
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
```

**Causa**: Em algum ponto de `Targets.tsx`, o `Skeleton` está sendo usado como filho direto de um componente Radix UI (como `Tooltip`, `TooltipTrigger`, etc.) que tenta injetar uma `ref` nele. A solução é converter `Skeleton` para usar `React.forwardRef`.

---

## Problema 2: Tela Branca no Ambiente Publicado

A imagem enviada mostra `organicpro.lovable.app` com **tela completamente branca**. As causas prováveis são:

### 2a. Sem spinner de loading inicial no HTML
O `main.tsx` atual não tem nenhum HTML de carregamento injetado antes do React inicializar. A memória do projeto menciona que *"a raw HTML/CSS spinner is injected directly into `rootElement.innerHTML` in `main.tsx`"* — mas isso **não está implementado**. O usuário vê uma tela branca durante o tempo em que o bundle JS está sendo baixado e executado.

### 2b. Cores customizadas podem não estar sendo geradas no build de produção
As classes como `bg-success`, `text-warning`, `bg-success/10` dependem dos tokens definidos no `tailwind.config.ts`. Se algum arquivo `.tsx` usar essas classes de forma dinâmica (strings concatenadas), o Tailwind pode removê-las no purge de produção. Isso não causaria tela branca mas poderia quebrar estilos.

---

## Plano de Correção

### Arquivo 1: `src/components/ui/skeleton.tsx`
Converter para `React.forwardRef` para eliminar o warning no console.

**Antes:**
```tsx
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
```

**Depois:**
```tsx
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
  )
);
Skeleton.displayName = "Skeleton";
```

### Arquivo 2: `src/main.tsx`
Adicionar um spinner HTML/CSS nativo que aparece **imediatamente** enquanto o React ainda não carregou, prevenindo a tela branca:

```tsx
const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Injeta spinner nativo antes do React inicializar
root.innerHTML = `
  <div id="app-init-loader" style="
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: hsl(240, 14%, 4%);
    z-index: 9999;
  ">
    <div style="
      width: 36px; height: 36px;
      border: 2px solid rgba(99,102,241,0.2);
      border-top-color: hsl(252,62%,60%);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    "></div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  </div>
`;

createRoot(root).render(
  <ErrorBoundary context="Aplicação">
    <App />
  </ErrorBoundary>
);
```

O spinner desaparece automaticamente quando o React substitui o `innerHTML` do `root`.

### Arquivo 3: `src/index.css` — Salvaguarda de classes dinâmicas
Garantir que as classes de tokens customizados (`success`, `warning`) usadas em strings dinâmicas não sejam purgadas pelo Tailwind no build de produção. Adicionar um bloco de salvaguarda comentado com `safelist` no `tailwind.config.ts`.

---

## Resumo das Mudanças

| Arquivo | Mudança | Impacto |
|---|---|---|
| `src/components/ui/skeleton.tsx` | Converter para `forwardRef` | Elimina warning no console |
| `src/main.tsx` | Adicionar spinner HTML nativo antes do React | Elimina tela branca |
| `tailwind.config.ts` | Adicionar `safelist` com padrões de classes dinâmicas | Previne purge incorreto em produção |
