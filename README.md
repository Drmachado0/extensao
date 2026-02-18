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
- [Testes](#testes)
- [Deploy](#deploy)
- [Contribuindo](#contribuindo)

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
  - Vitest (testes)
  - ESLint (linting)
  - TypeScript (type checking)

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

# Build
npm run build           # Build para produção
npm run build:dev        # Build em modo desenvolvimento
npm run preview          # Preview do build de produção

# Qualidade de Código
npm run lint            # Executa ESLint
npm run test            # Executa testes
npm run test:watch      # Executa testes em modo watch
```

## 🧪 Testes

Execute os testes com:

```bash
npm run test
```

Para modo watch:

```bash
npm run test:watch
```

### Estrutura de Testes

- Testes unitários: `src/**/__tests__/**/*.test.ts`
- Testes de hooks: `src/hooks/__tests__/`
- Testes de utilitários: `src/lib/__tests__/`

## 📚 Documentação Adicional

- [Melhorias Propostas](./MELHORIAS_PROPOSTAS.md) - Documento completo com melhorias e roadmap
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 🚢 Deploy

### Deploy no Lovable

1. Abra o projeto no [Lovable](https://lovable.dev)
2. Vá em Share → Publish
3. Configure o domínio (opcional)

### Deploy Manual

1. **Build:**
```bash
npm run build
```

2. **Deploy do build:**
   - O diretório `dist/` contém os arquivos estáticos
   - Faça deploy em qualquer serviço de hospedagem estática:
     - Vercel
     - Netlify
     - Cloudflare Pages
     - GitHub Pages

3. **Configure variáveis de ambiente** no serviço de hospedagem

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript strict mode quando possível
- Siga os padrões do ESLint configurado
- Escreva testes para novas funcionalidades
- Documente funções complexas com JSDoc
- Use commits semânticos

## 📝 Licença

Este projeto é privado e proprietário.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email de suporte.

---

**Desenvolvido com ❤️ usando React, TypeScript e Supabase**
