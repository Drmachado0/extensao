

# Organic Pro — Dashboard SaaS de Crescimento Instagram

## Visão Geral
Plataforma completa de gerenciamento de crescimento orgânico no Instagram, com tema escuro premium, acentos em roxo/gradiente, e cards com efeito glassmorphism.

---

## 1. Landing Page (Pública)
- **Hero Section** com headline impactante, CTA principal, e mockup/ilustração do dashboard
- **Seção de Features** — cards destacando: automação inteligente, filtros avançados, analytics, segurança
- **Seção de Pricing** com 3 planos:
  - **Free** — R$0 (limites básicos)
  - **Pro** — R$49/mês (limites expandidos)
  - **Business** — R$99/mês (sem limites, suporte prioritário)
- Footer com links úteis

## 2. Autenticação (Login / Registro)
- Login e registro com **email/senha** via Supabase Auth
- Botão de login com **Google OAuth**
- Redirecionamento automático ao dashboard após login
- Rota protegida para todas as páginas internas

## 3. Layout do Dashboard
- **Sidebar** com navegação por ícones e labels:
  - Dashboard, Contas, Fila de Ações, Filtros, Configurações, Logs, Assinatura
  - Colapsável para modo mini (apenas ícones)
  - Destaque visual na rota ativa
- **Header** com avatar do usuário, nome, dropdown de perfil e ícone de notificações
- Tema escuro com acento roxo (#7C3AED → #4F46E5), glassmorphism nos cards

## 4. Dashboard Principal
- Cards de métricas resumidas: follows hoje, unfollows, likes, ações totais
- Gráfico de crescimento (followers ao longo do tempo) usando Recharts
- Status das contas Instagram conectadas
- Atividade recente (últimas ações realizadas)

## 5. Página "Contas Instagram"
- Lista de contas Instagram conectadas (da tabela `instagram_accounts`)
- Exibir username, foto de perfil, contagem de followers/following, status
- Botão para adicionar nova conta e para ativar/desativar conta
- Indicador visual de conta ativa

## 6. Página "Fila de Ações"
- Tabela/lista das ações agendadas (tabela `scheduled_actions`)
- Filtros por tipo de ação (follow, unfollow, like)
- Status de cada ação (pendente, executada, erro)
- Capacidade de pausar/retomar e cancelar ações

## 7. Página "Filtros"
- Gerenciar filtros salvos (tabela `filters`)
- Criar/editar presets com critérios (mín/máx followers, engajamento, etc.)
- Interface visual amigável para configurar critérios em JSON

## 8. Página "Configurações"
- Configurações de automação (delays, limites de ações por hora/dia)
- Pausar/retomar automação globalmente
- Preferências de notificação
- Dados carregados da tabela `user_settings`

## 9. Página "Logs"
- Tabela paginada com histórico de todas as ações (tabela `action_history` + `activity_log`)
- Filtros por data, tipo de ação, resultado (sucesso/erro)
- Exportar dados (futuro)

## 10. Página "Assinatura"
- Exibir plano atual do usuário (campo `plan` em `profiles`)
- Cards dos 3 planos com destaque no plano ativo
- Botão de upgrade/downgrade (integração Stripe futura)

---

## Design System
- **Tema escuro** como padrão
- **Cores primárias**: gradiente roxo (#7C3AED → #4F46E5)
- **Cards**: fundo semi-transparente com backdrop-blur (glassmorphism)
- **Tipografia**: clean e moderna via Tailwind defaults
- **Componentes**: shadcn/ui com customizações de cor

## Stack Técnica
- React + TypeScript + Tailwind + shadcn/ui
- Supabase (já conectado) para auth, banco de dados e RLS
- Recharts para gráficos
- React Router para navegação
- Dados reais das tabelas já existentes no banco

