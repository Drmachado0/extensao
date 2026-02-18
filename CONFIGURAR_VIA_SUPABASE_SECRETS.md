# 🔧 Configurar Variáveis via Supabase Secrets (Lovable)

## ✅ Entendido: Lovable usa Supabase Secrets

O Lovable está conectado ao Supabase e usa os **Edge Function Secrets** como variáveis de ambiente para o frontend!

## 📋 Como Configurar

### 1️⃣ Acesse Edge Function Secrets no Supabase

1. **No Supabase Dashboard:**
   - Vá em **Edge Functions** → **Secrets**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/functions

### 2️⃣ Verifique/Configure os Secrets

Você já tem configurado:
- ✅ `VITE_SUPABASE_URL` (atualizado em 18 Feb 2026 14:22:37)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (atualizado em 18 Feb 2026 14:17:18)

### 3️⃣ Verifique os Valores

Certifique-se de que os valores estão corretos:

**Secret: `VITE_SUPABASE_URL`**
```
Valor deve ser: https://ebyruchdswmkuynthiqi.supabase.co
```

**Secret: `VITE_SUPABASE_PUBLISHABLE_KEY`**
```
Valor deve ser: sb_publishable_swY4Zx6Luqm1ZyVvsKyd3g_T4X8QLGT
```

### 4️⃣ Se Precisar Atualizar

1. **Na tela de Secrets:**
   - Clique em "Add or replace secrets"
   - Preencha:
     - **Name:** `VITE_SUPABASE_URL`
     - **Value:** `https://ebyruchdswmkuynthiqi.supabase.co`
   - Clique em "Add another"
   - Preencha:
     - **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
     - **Value:** `sb_publishable_swY4Zx6Luqm1ZyVvsKyd3g_T4X8QLGT`
   - Clique em "Save"

### 5️⃣ No Lovable

1. **Aguarde a sincronização** (pode levar alguns segundos)
2. **Recarregue o preview** no Lovable
3. **Publique:** Share → Publish

## 🔄 Como Funciona

```
Supabase Secrets → Lovable sincroniza → Frontend React usa
```

O Lovable:
1. Conecta ao Supabase
2. Lê os Edge Function Secrets
3. Injeta como variáveis de ambiente no build
4. Frontend React acessa via `import.meta.env.VITE_*`

## ✅ Verificação

Após configurar os secrets no Supabase:

1. **No Lovable:**
   - Recarregue o preview
   - A aplicação deve funcionar normalmente
   - Não deve mais aparecer o erro de variáveis faltando

2. **No código:**
   - `import.meta.env.VITE_SUPABASE_URL` deve ter valor
   - `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` deve ter valor

## 🎯 Resumo

- ✅ **Lovable conectado ao Supabase** → Usa secrets do Supabase
- ✅ **Secrets já configurados** → `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- ⚠️ **Verifique os valores** → Certifique-se que estão corretos
- ✅ **Publique no Lovable** → Após verificar, publique

## 🔍 Links Úteis

- **Supabase Secrets:** https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/functions
- **Lovable:** https://lovable.dev

---

**Última atualização:** 18/02/2026
