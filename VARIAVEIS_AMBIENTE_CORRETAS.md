# ✅ Variáveis de Ambiente CORRETAS para Lovable

## ⚠️ IMPORTANTE: Use `VITE_` e não `NEXT_PUBLIC_`

O projeto usa **Vite**, não Next.js! As variáveis devem começar com `VITE_`.

## 🔧 Variáveis Corretas para Configurar no Lovable

### Variável 1: URL do Supabase
```
Nome: VITE_SUPABASE_URL
Valor: https://ebyruchdswmkuynthiqi.supabase.co
```

### Variável 2: Chave Pública do Supabase
```
Nome: VITE_SUPABASE_PUBLISHABLE_KEY
Valor: sb_publishable_swY4Zx6Luqm1ZyVvsKyd3g_T4X8QLGT
```

## ❌ NÃO USE (errado):
```
NEXT_PUBLIC_SUPABASE_URL=...           ❌ ERRADO!
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... ❌ ERRADO!
```

## ✅ USE (correto):
```
VITE_SUPABASE_URL=...                  ✅ CORRETO!
VITE_SUPABASE_PUBLISHABLE_KEY=...      ✅ CORRETO!
```

## 📋 Como Configurar no Lovable

1. **Abra o projeto no Lovable**
2. **Vá em Settings → Environment Variables**
3. **Adicione as duas variáveis:**

   **Variável 1:**
   - Nome: `VITE_SUPABASE_URL`
   - Valor: `https://ebyruchdswmkuynthiqi.supabase.co`

   **Variável 2:**
   - Nome: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Valor: `sb_publishable_swY4Zx6Luqm1ZyVvsKyd3g_T4X8QLGT`

4. **Salve as configurações**
5. **Publique:** Share → Publish

## 🔍 Por que `VITE_` e não `NEXT_PUBLIC_`?

- **Vite** usa o prefixo `VITE_` para variáveis de ambiente
- **Next.js** usa o prefixo `NEXT_PUBLIC_` para variáveis de ambiente
- Este projeto usa **Vite** (veja `vite.config.ts` e `package.json`)
- O código em `src/integrations/supabase/client.ts` procura por `VITE_SUPABASE_URL`

## ✅ Verificação

Após configurar, verifique:
- ✅ Variáveis começam com `VITE_`
- ✅ Nomes exatos: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ Valores corretos (sem espaços extras)
- ✅ Aplicação funciona após rebuild

---

**Última atualização:** 18/02/2026
