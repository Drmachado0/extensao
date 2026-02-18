# 🚀 OrganicPro - Automação Instagram

Plataforma completa para automação e crescimento orgânico no Instagram com monitoramento em tempo real.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Desenvolvimento](#desenvolvimento)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy-no-lovable)

## ✨ Características

- 🤖 **Automação Inteligente**: Follow, unfollow e likes automáticos com delays humanizados
- 📊 **Analytics em Tempo Real**: Dashboard completo com métricas de crescimento
- 🎯 **Filtros Avançados**: Segmentação por followers, engajamento, nicho e muito mais
- 🔒 **Segurança**: Limites inteligentes para proteger sua conta contra bloqueios
- 📈 **Crescimento Orgânico**: Acompanhe seu crescimento com gráficos detalhados
- 🔄 **Sincronização em Tempo Real**: Sincronização automática com extensão Bridge
- 📝 **Templates de Comentários**: Sistema de templates para comentários personalizados
- 🎨 **Interface Moderna**: UI moderna e responsiva com dark mode

## 🛠 Tecnologias

- **Frontend:**
  - React 18.3
  - TypeScript 5.8
  - Vite 5.4
  - Tailwind CSS 3.4
  - shadcn/ui
  - React Router 6.30
  - TanStack Query 5.83
  - React Hook Form 7.61
  - Zod 3.25

- **Backend:**
  - Supabase (PostgreSQL + Auth + Realtime)
  - Edge Functions

- **Ferramentas:**
  - ESLint (linting)
  - TypeScript (type checking)
  - Vite (build tool otimizado)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn
- Conta no Supabase

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/Drmachado0/organicpro.git
cd organicpro
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` no Git. Ele já está no `.gitignore`.

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations do banco de dados (em `supabase/migrations/`)
3. Configure as políticas RLS (Row Level Security)
4. Configure as Edge Functions (em `supabase/functions/`)

## 🚀 Desenvolvimento

### Estrutura do Projeto

```
organicpro/
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes base (shadcn)
│   │   └── ...          # Componentes específicos
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilitários e helpers
│   │   ├── validations/ # Schemas Zod
│   │   ├── constants.ts # Constantes
│   │   ├── logger.ts    # Sistema de logging
│   │   └── errorHandler.ts # Tratamento de erros
│   ├── pages/           # Páginas da aplicação
│   ├── integrations/    # Integrações (Supabase)
│   └── App.tsx          # Componente raiz
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Migrations do banco
├── public/              # Arquivos estáticos
└── package.json
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build (para Lovable)
npm run build           # Build otimizado para produção
npm run preview          # Preview do build de produção

# Qualidade de Código
npm run lint            # Executa ESLint
```


## 📚 Documentação Adicional

- [Otimizações para Lovable](./LOVABLE_OTIMIZACOES.md) - Guia completo de configuração e otimizações
- [Changelog](./CHANGELOG.md) - Histórico de mudanças
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 🚢 Deploy no Lovable

Este projeto está otimizado para rodar no [Lovable](https://lovable.dev).

### Configuração no Lovable

1. **Abra o projeto no Lovable**
2. **Configure as variáveis de ambiente:**
   - Vá em **Settings → Environment Variables**
   - Adicione:
     - `VITE_SUPABASE_URL` - URL do seu projeto Supabase (ex: `https://xxxxx.supabase.co`)
     - `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave pública do Supabase (anon key)
3. **Publique:**
   - Vá em **Share → Publish**
   - Configure o domínio (opcional)
   - O projeto será buildado e publicado automaticamente

### Otimizações para Lovable

- ✅ Build otimizado com code splitting automático
- ✅ Chunks separados para melhor cache
- ✅ Remoção automática de console.log em produção
- ✅ Validação de variáveis de ambiente com tela de configuração
- ✅ Configurações otimizadas para produção

Para mais detalhes, consulte [LOVABLE_OTIMIZACOES.md](./LOVABLE_OTIMIZACOES.md)

## 📚 Documentação Adicional

- [Otimizações para Lovable](./LOVABLE_OTIMIZACOES.md) - Guia completo de configuração
- [Otimizações Completas](./OTIMIZACOES_LOVABLE_COMPLETAS.md) - Detalhes técnicos das otimizações
- [Changelog](./CHANGELOG.md) - Histórico de mudanças
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 📝 Licença

Este projeto é privado e proprietário.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email de suporte.

---

**Desenvolvido com ❤️ usando React, TypeScript e Supabase**
