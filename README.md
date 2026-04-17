# 🚀 OrganicPro - Automação Instagram

Plataforma completa para automação e crescimento orgânico no Instagram com monitoramento em tempo real. Este repositório contém dois projetos complementares:

- **Dashboard (OrganicPro)** — app web Vite/React com Supabase
- **Extensão (Organic Automator)** — extensão Chrome/Edge (Manifest V3) integrada ao dashboard

## 📋 Índice

- [Dashboard](#dashboard-organicpro)
  - [Características](#características)
  - [Tecnologias](#tecnologias)
  - [Instalação](#instalação)
  - [Configuração](#configuração)
  - [Desenvolvimento](#desenvolvimento)
  - [Deploy](#deploy-no-lovable)
- [Extensão (Organic Automator 8.1.x)](#extensão-organic-automator-81x)
  - [Instalação (modo desenvolvedor)](#instalação-modo-desenvolvedor)
  - [Como usar](#como-usar)
  - [Sistema de segurança](#sistema-de-segurança-prevenção-de-rate-limit)

---

## Dashboard (OrganicPro)

### ✨ Características

- 🤖 **Automação Inteligente**: Follow, unfollow e likes automáticos com delays humanizados
- 📊 **Analytics em Tempo Real**: Dashboard completo com métricas de crescimento
- 🎯 **Filtros Avançados**: Segmentação por followers, engajamento, nicho e muito mais
- 🔒 **Segurança**: Limites inteligentes para proteger sua conta contra bloqueios
- 📈 **Crescimento Orgânico**: Acompanhe seu crescimento com gráficos detalhados
- 🔄 **Sincronização em Tempo Real**: Sincronização automática com extensão Bridge
- 📝 **Templates de Comentários**: Sistema de templates para comentários personalizados
- 🎨 **Interface Moderna**: UI moderna e responsiva com dark mode

### 🛠 Tecnologias

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

### 📦 Instalação

#### Pré-requisitos

- Node.js 18+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn
- Conta no Supabase

#### Passos

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

### ⚙️ Configuração

#### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` no Git. Ele já está no `.gitignore`.

#### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations do banco de dados (em `supabase/migrations/`)
3. Configure as políticas RLS (Row Level Security)
4. Configure as Edge Functions (em `supabase/functions/`)

### 🚀 Desenvolvimento

#### Estrutura do Projeto

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

#### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build (para Lovable)
npm run build            # Build otimizado para produção
npm run preview          # Preview do build de produção

# Qualidade de Código
npm run lint             # Executa ESLint
```

### 🚢 Deploy no Lovable

Este projeto está otimizado para rodar no [Lovable](https://lovable.dev).

#### Configuração no Lovable

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

#### Otimizações para Lovable

- ✅ Build otimizado com code splitting automático
- ✅ Chunks separados para melhor cache
- ✅ Remoção automática de console.log em produção
- ✅ Validação de variáveis de ambiente com tela de configuração
- ✅ Configurações otimizadas para produção

Para mais detalhes, consulte [LOVABLE_OTIMIZACOES.md](./LOVABLE_OTIMIZACOES.md)

### 📚 Documentação Adicional

- [Otimizações para Lovable](./LOVABLE_OTIMIZACOES.md) - Guia completo de configuração
- [Otimizações Completas](./OTIMIZACOES_LOVABLE_COMPLETAS.md) - Detalhes técnicos das otimizações
- [Changelog](./CHANGELOG.md) - Histórico de mudanças
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

---

## Extensão (Organic Automator 8.1.x)

Extensão para Chrome/Edge (Manifest V3) que integra automação no Instagram (filas de follow/unfollow, curtir, stories, filtros, etc.) com o painel Lovable e o IG List Collector.

### Versão final — pronta para uso e teste

Esta versão foi revisada e ajustada para:

- **Sem bloqueio por trial/assinatura**: a extensão trata sempre como licenciada; não exibe "Subscribe Now" nem tela de compra.
- **Interface limpa**: mensagem de trial e link de subscribe removidos do cabeçalho.
- **Correções**: id duplicado em Settings (Removing and Blocking Options) corrigido; uso de `chrome.runtime.sendMessage` em vez da API deprecada.
- **Ícones**: incluídos ícones mínimos (16, 48, 128 px) para a extensão carregar corretamente.

### Revisão do sistema (correções e melhorias)

- **IG List Collector**: scroll corrigido (altura máxima da área rolável + roda do mouse); painel abre/fecha em sintonia com o popup e o bridge (classe `hidden` apenas); proteção contra elementos nulos em filtros e configurações.
- **Bridge (Organic ↔ Collector)**: abertura/fechamento do painel usa só a classe `hidden`, sem alterar `display`, evitando estado inconsistente.
- **Mensagens**: o collector escuta `OPEN_COLLECTOR` e `TOGGLE_COLLECTOR` além de `toggleCollector`, para o botão do popup funcionar corretamente.
- **UX**: barra de rolagem do painel com hover; `saveSettings` com checagens de elementos.

### Requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave, etc.)
- Conta no Instagram (logada no mesmo navegador)
- Para o painel Lovable: conta no dashboard (organicpublic.lovable.app)

### Instalação (modo desenvolvedor)

1. Abra o navegador e vá a:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
2. Ative **Modo do programador** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta do projeto: `organic-v7.2-final - Copia`.
5. A extensão deve aparecer na barra de ferramentas (ícone do Organic).

Se aparecer erro por ícones, confirme que existem na pasta raiz:

- `icon_16.png`
- `icon_48.png`
- `icon_128.png`

### Como usar

1. **Abrir o Instagram**
   Acesse https://www.instagram.com e faça login.

2. **Abrir o Organic na página**
   - Clique no ícone da extensão na barra de ferramentas para abrir o popup (Organic + Lovable).
   - No popup, use **「Abrir Instagram + Organic」** para abrir/focar uma aba do Instagram e mostrar o painel do Organic na página.
   - Ou use o atalho/ação configurada para alternar a visibilidade do painel.

3. **Fluxo básico**
   - **Accounts Queue**: carregar contas (Load Accounts → ex.: Load Current Page's Followers, Load Likers, Load Queue, etc.).
   - Ajustar **Filters** se quiser (seguidores, seguindo, ratio, etc.).
   - Em **Process Queue** escolher a ação (Follow, Unfollow, Like Only, etc.) e clicar em **Process Queue**.
   - Acompanhar o **Log** e o status no topo.

4. **Media Queue**
   Para curtir publicações: carregar posts (Load Posts from Feed, Load This Post, etc.), depois **Like Media Queue Posts** ou ações equivalentes.

5. **Settings**
   Configure tempos de espera, opções de follow/unfollow, colunas da fila, etc.

6. **Lovable (opcional)**
   No popup, faça login no dashboard Lovable para sincronizar filas, limites de segurança e agendamento.

### Estrutura principal

| Item              | Descrição |
|-------------------|-----------|
| `manifest.json`   | Configuração da extensão (Manifest V3) |
| `organic.html`    | Markup do painel injetado no Instagram |
| `contentscript.js` | Lógica principal do Organic na página |
| `backgroundscript.js` | Service worker (mensagens, licença, abas) |
| `lovable-popup.html` / `lovable-popup.js` | Popup Organic + Lovable |
| `collector.js` / `collector.css` | IG List Collector |
| `organic-iglc-bridge.js` | Ponte entre Organic e Collector |
| `_locales/`       | Traduções (en, pt_BR, pt_PT, es) |

### Testes recomendados

1. Carregar a extensão em `chrome://extensions` e verificar que não há erros.
2. Abrir https://www.instagram.com e confirmar que o painel do Organic aparece ao usar o botão do popup.
3. Testar **Load** (ex.: Load Current Page's Followers) numa página de perfil.
4. Testar **Process Queue** com uma ação simples (ex.: Follow ou Like Only) com poucos itens.
5. Ver **Settings** e **Filters** e alterar opções para garantir que não há erros de consola.
6. Se usar Lovable: login no popup e verificar sincronização de fila/contadores.

### Sistema de segurança (prevenção de rate limit)

- **LovableSafety (Safety Guard)**: antes de cada ação (seguir, deixar de seguir, curtir), o Organic chama `canProceed()`. Se o limite por hora/dia, cooldown ou "calor" diário estiver ativo, a ação é adiada automaticamente.
- **429 / 403 / 400**: cada resposta de rate limit ou bloqueio é registrada em `recordAction()`; o calor sobe e, após N ocorrências, um cooldown escalado é aplicado (bot pausa).
- **403 (soft)** e **429**: tratados de forma distinta — 403 adiciona calor moderado; 429 conta como rate limit e pode disparar cooldown. Delay padrão após 429 aumentado para 2 min.
- **Delay entre ações**: quando o Safety Guard está ativo, o intervalo entre ações usa no mínimo o `getRecommendedDelay()` (que sobe com calor, proximidade do limite e horário noturno).
- **Presets (nova / média / madura)**: no popup, escolher o preset aplica limites e delays alinhados ao Safety Guard e ao Organic.

### Observações

- **Limites do Instagram**: use delays e filtros adequados para reduzir risco de bloqueios; as opções em Settings e o Safety Guard no Lovable ajudam.
- **Re-link Subscription**: a opção em Settings permanece disponível para quem tiver assinatura no site oficial; não é obrigatória para uso local.
- **Versão**: 7.2.0 (manifest); o popup Lovable pode mostrar outra versão (ex.: 2.5.0) referente ao painel.

---

## 📝 Licença

Este projeto é privado e proprietário.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email de suporte.

---

**Desenvolvido com ❤️ usando React, TypeScript e Supabase — com extensão Chrome/Edge complementar.**
