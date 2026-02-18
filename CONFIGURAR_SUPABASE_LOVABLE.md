# 🔧 Como Configurar Supabase no Lovable

## 📋 Passo a Passo Completo

### 1️⃣ Obter Credenciais do Supabase

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/ebyruchdswmkuynthiqi/editor
   - Faça login na sua conta Supabase

2. **Obter a URL do Projeto:**
   - No dashboard, vá em **Settings** → **API**
   - Copie a **Project URL** (algo como: `https://ebyruchdswmkuynthiqi.supabase.co`)
   - Esta é a variável `VITE_SUPABASE_URL`

3. **Obter a Chave Pública (Anon Key):**
   - Na mesma página (Settings → API)
   - Procure por **Project API keys**
   - Copie a chave **`anon`** ou **`public`** (não use a `service_role`)
   - Esta é a variável `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2️⃣ Configurar no Lovable

1. **Abra o projeto no Lovable:**
   - Acesse https://lovable.dev
   - Abra seu projeto OrganicPro

2. **Vá para Configurações:**
   - Clique em **Settings** (ou Configurações)
   - Procure por **Environment Variables** (Variáveis de Ambiente)

3. **Adicione as Variáveis:**
   
   **Variável 1:**
   - **Nome:** `VITE_SUPABASE_URL`
   - **Valor:** Cole a URL do projeto (ex: `https://ebyruchdswmkuynthiqi.supabase.co`)

   **Variável 2:**
   - **Nome:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Valor:** Cole a chave pública `anon` do Supabase

4. **Salve as Configurações:**
   - Clique em **Save** ou **Salvar**
   - Aguarde a confirmação

### 3️⃣ Publicar no Lovable

1. **Após configurar as variáveis:**
   - Vá em **Share** → **Publish**
   - O Lovable irá fazer o build automaticamente
   - Aguarde o processo de build completar

2. **Verificar:**
   - Após o build, a aplicação deve funcionar normalmente
   - O componente `SupabaseConfigWarning` não deve mais aparecer
   - Você poderá fazer login e usar todas as funcionalidades

## ⚠️ Importante

- ✅ **Nunca** compartilhe a chave `service_role` publicamente
- ✅ Use apenas a chave `anon` ou `public` no frontend
- ✅ As variáveis devem começar com `VITE_` para funcionar no Vite
- ✅ Após adicionar as variáveis, o Lovable fará um novo build automaticamente

## 🔍 Onde Encontrar no Supabase Dashboard

### Caminho Completo:
1. Dashboard → Seu Projeto (`ebyruchdswmkuynthiqi`)
2. **Settings** (ícone de engrenagem no menu lateral)
3. **API** (na lista de configurações)
4. **Project URL** → Copiar
5. **Project API keys** → Copiar a chave `anon` ou `public`

## 📝 Exemplo de Valores

```
VITE_SUPABASE_URL=https://ebyruchdswmkuynthiqi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Não use valores de exemplo!** Use os valores reais do seu projeto Supabase.

## ✅ Verificação

Após configurar, você deve ver:
- ✅ Aplicação carrega normalmente
- ✅ Tela de login aparece
- ✅ Conexão com Supabase funcionando
- ✅ Sem erros no console sobre variáveis faltando

---

**Última atualização:** 18/02/2026
