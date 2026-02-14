# GrowBot Automator 7.2.0 for Instagram™

Extensão para Chrome/Edge (Manifest V3) que integra automação no Instagram (filas de follow/unfollow, curtir, stories, filtros, etc.) com o painel Lovable e o IG List Collector.

## Versão final — pronta para uso e teste

Esta versão foi revisada e ajustada para:

- **Sem bloqueio por trial/assinatura**: a extensão trata sempre como licenciada; não exibe "Subscribe Now" nem tela de compra.
- **Interface limpa**: mensagem de trial e link de subscribe removidos do cabeçalho.
- **Correções**: id duplicado em Settings (Removing and Blocking Options) corrigido; uso de `chrome.runtime.sendMessage` em vez da API deprecada.
- **Ícones**: incluídos ícones mínimos (16, 48, 128 px) para a extensão carregar corretamente.

## Requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave, etc.)
- Conta no Instagram (logada no mesmo navegador)
- Para o painel Lovable: conta no dashboard (organicpublic.lovable.app)

## Instalação (modo desenvolvedor)

1. Abra o navegador e vá a:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
2. Ative **Modo do programador** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta do projeto: `growbot-v7.2-final - Copia`.
5. A extensão deve aparecer na barra de ferramentas (ícone do GrowBot).

Se aparecer erro por ícones, confirme que existem na pasta raiz:

- `icon_16.png`
- `icon_48.png`
- `icon_128.png`

(Se quiser ícones melhores, substitua por PNGs 16×16, 48×48 e 128×128.)

**Ícone da extensão:** [Instagram](https://iconscout.com/icons/instagram) by [Pixel Icons](https://iconscout.com/pt/contributors/pixel-icons) (IconScout). Para usar: baixe em PNG, exporte nos tamanhos 16×16, 48×48 e 128×128 e salve como `icon_16.png`, `icon_48.png` e `icon_128.png` na raiz do projeto.

## Como usar

1. **Abrir o Instagram**  
   Acesse https://www.instagram.com e faça login.

2. **Abrir o GrowBot na página**  
   - Clique no ícone da extensão na barra de ferramentas para abrir o popup (GrowBot + Lovable).  
   - No popup, use **「Abrir Instagram + GrowBot」** para abrir/focar uma aba do Instagram e mostrar o painel do GrowBot na página.  
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

## Estrutura principal

| Item              | Descrição |
|-------------------|-----------|
| `manifest.json`   | Configuração da extensão (Manifest V3) |
| `growbot.html`   | Markup do painel injetado no Instagram |
| `contentscript.js` | Lógica principal do GrowBot na página |
| `backgroundscript.js` | Service worker (mensagens, licença, abas) |
| `lovable-popup.html` / `lovable-popup.js` | Popup GrowBot + Lovable |
| `collector.js` / `collector.css` | IG List Collector |
| `growbot-iglc-bridge.js` | Ponte entre GrowBot e Collector |
| `_locales/`      | Traduções (en, pt_BR, pt_PT, es) |

## Testes recomendados

1. Carregar a extensão em `chrome://extensions` e verificar que não há erros.
2. Abrir https://www.instagram.com e confirmar que o painel do GrowBot aparece ao usar o botão do popup.
3. Testar **Load** (ex.: Load Current Page's Followers) numa página de perfil.
4. Testar **Process Queue** com uma ação simples (ex.: Follow ou Like Only) com poucos itens.
5. Ver **Settings** e **Filters** e alterar opções para garantir que não há erros de consola.
6. Se usar Lovable: login no popup e verificar sincronização de fila/contadores.

## Observações

- **Limites do Instagram**: use delays e filtros adequados para reduzir risco de bloqueios; as opções em Settings e o Safety Guard no Lovable ajudam.
- **Re-link Subscription**: a opção em Settings permanece disponível para quem tiver assinatura no site oficial; não é obrigatória para uso local.
- **Versão**: 7.2.0 (manifest); o popup Lovable pode mostrar outra versão (ex.: 2.5.0) referente ao painel.

---

**GrowBot Automator for Instagram™** — versão final revisada para uso e teste local.
