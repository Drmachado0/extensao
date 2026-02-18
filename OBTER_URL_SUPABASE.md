# 🔍 Como Obter a URL do Supabase

## 📋 Passo a Passo Rápido

### 1️⃣ Acesse o Dashboard do Supabase

1. Vá para: https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/editor
2. Faça login se necessário

### 2️⃣ Encontre a URL do Projeto

1. **No menu lateral esquerdo**, clique em **Settings** (ícone de engrenagem ⚙️)
2. Na lista de configurações, clique em **API**
3. Na página que abrir, você verá:

   **Project URL**
   ```
   https://ebyruchdswmkuynthiqi.supabase.co
   ```
   
   ⬆️ **Esta é a URL que você precisa copiar!**

### 3️⃣ Copie a URL

- Clique no botão de **copiar** ao lado da URL (ícone de clipboard 📋)
- OU selecione o texto completo e copie (Ctrl+C)

### 4️⃣ Configure no Lovable

1. Abra seu projeto no **Lovable**
2. Vá em **Settings** → **Environment Variables**
3. Clique em **Add Variable** ou **Nova Variável**
4. Preencha:
   - **Nome:** `VITE_SUPABASE_URL`
   - **Valor:** Cole a URL que você copiou (ex: `https://ebyruchdswmkuynthiqi.supabase.co`)
5. Clique em **Save** ou **Salvar**

## 📝 Exemplo Visual

```
Supabase Dashboard → Settings → API

┌─────────────────────────────────────────┐
│ Project URL                             │
│ ┌─────────────────────────────────────┐ │
│ │ https://ebyruchdswmkuynthiqi.supabase│ │
│ │ .co                                   │ │
│ └─────────────────────────────────────┘ │
│ [📋 Copiar]                             │
└─────────────────────────────────────────┘
```

## ✅ Verificação

Após adicionar a variável no Lovable:
- ✅ A variável `VITE_SUPABASE_URL` deve aparecer na lista
- ✅ O valor deve ser algo como: `https://ebyruchdswmkuynthiqi.supabase.co`
- ✅ Não deve ter barra `/` no final

## 🔗 Links Rápidos

- **Dashboard Supabase**: https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/editor
- **Settings → API**: https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/settings/api

---

**Dica:** A URL geralmente segue o padrão: `https://[seu-project-id].supabase.co`
