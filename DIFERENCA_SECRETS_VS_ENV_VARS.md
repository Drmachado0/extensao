# 🔍 Diferença: Edge Function Secrets vs Variáveis de Ambiente Lovable

## ⚠️ IMPORTANTE: São coisas diferentes!

### 🔐 Edge Function Secrets (Supabase)
- **Onde:** Supabase Dashboard → Edge Functions → Secrets
- **Para que:** Usado apenas dentro das **Edge Functions** (código server-side)
- **Exemplo:** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- **Não serve para:** Frontend React no Lovable

### 🌐 Variáveis de Ambiente Lovable
- **Onde:** Lovable → Settings → Environment Variables
- **Para que:** Usado no **frontend React** (código client-side)
- **Exemplo:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Serve para:** Aplicação React que roda no navegador

## 📊 Comparação

| | Edge Function Secrets | Variáveis Lovable |
|---|---|---|
| **Localização** | Supabase Dashboard | Lovable Settings |
| **Uso** | Edge Functions (server) | Frontend React (client) |
| **Acesso** | Apenas no código server-side | Código client-side (navegador) |
| **Segurança** | Secrets privados | Variáveis públicas (mas seguras com RLS) |

## ✅ O que você precisa fazer

### 1. Edge Function Secrets (já configurado ✅)
Você já tem os secrets no Supabase:
- ✅ `VITE_SUPABASE_URL` (para Edge Functions)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (para Edge Functions)

**Isso está correto para Edge Functions!**

### 2. Variáveis de Ambiente Lovable (precisa configurar ⚠️)
Agora configure no **Lovable**:

1. **Abra o Lovable**
2. **Vá em Settings → Environment Variables**
3. **Adicione:**

   ```
   Nome: VITE_SUPABASE_URL
   Valor: https://ebyruchdswmkuynthiqi.supabase.co
   ```

   ```
   Nome: VITE_SUPABASE_PUBLISHABLE_KEY
   Valor: sb_publishable_swY4Zx6Luqm1ZyVvsKyd3g_T4X8QLGT
   ```

4. **Salve e publique**

## 🎯 Resumo

- ✅ **Edge Function Secrets** (Supabase) → Para funções server-side
- ⚠️ **Variáveis Lovable** → Para frontend React (ainda precisa configurar!)

**Você precisa configurar as variáveis no Lovable mesmo tendo os secrets no Supabase!**

São ambientes diferentes:
- **Supabase Secrets** = Backend (Edge Functions)
- **Lovable Env Vars** = Frontend (React App)

---

**Última atualização:** 18/02/2026
