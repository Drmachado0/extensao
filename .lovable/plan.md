
# Correção: Badge "Offline" mesmo com extensão conectada

## Problema Identificado

O hook `useBotStatus` calcula `isOnline = botOnline && isHeartbeatRecent` onde "recente" = heartbeat < 5 minutos. Como o último heartbeat foi há 9 horas, `isOnline = false` — fazendo o badge mostrar "Offline".

Mas há dois conceitos distintos que estão sendo confundidos:

1. **Extensão conectada** — `bot_online = true` no banco. Significa que a extensão está instalada e já se comunicou com o Supabase. Não requer heartbeat recente.
2. **Bot ativo/rodando** — heartbeat nos últimos N minutos. Significa que o bot está executando ações agora.

O badge deve mostrar "Extensão conectada" quando `bot_online = true`, independente do heartbeat. O heartbeat serve apenas para o indicador de "bot rodando agora".

## Solução

### 1. Expor `botConnected` no `useBotStatus`

Adicionar um campo `botConnected: boolean` que retorna o valor bruto de `bot_online` (sem checar o heartbeat). Isso permite que o banner/badge distinga entre extensão conectada e bot rodando ativamente.

```
botConnected = botOnline  (campo raw, sem checar heartbeat)
isOnline     = botOnline && isHeartbeatRecent  (mantido como está)
```

### 2. Atualizar `useExtensionStatus` no `ExtensionBanner.tsx`

Usar `botConnected` (não `isOnline`) para determinar se a **extensão está instalada/conectada**:

```
isActive = bot.botConnected || dom.extensionDetected === true
```

Manter `bot.isOnline` para o label do badge — assim distinguimos:
- `bot.isOnline` (heartbeat recente) → "Bot ativo"  
- `bot.botConnected && !bot.isOnline` → "Extensão conectada" (bot parado)
- nenhum dos dois → "Instalar extensão"

### 3. Atualizar o Badge de Status

Três estados visuais:

| Estado | Cor | Ícone | Texto |
|---|---|---|---|
| Bot ativo (heartbeat recente) | Verde brilhante | Wifi | "Bot ativo" |
| Extensão conectada (sem heartbeat recente) | Verde suave | CheckCircle2 | "Extensão conectada" |
| Não detectada | Âmbar | Download | "Instalar extensão" |

### 4. Ajustar o threshold de heartbeat (opcional)

O threshold atual de 5 minutos é muito rígido para um indicador de "bot ativo". Pode ser aumentado para 30 minutos para corresponder melhor à realidade de uso (o bot pode rodar por períodos e parar).

Mas mesmo assim, o badge de **extensão conectada** usará `botConnected` (sem limite de tempo).

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useBotStatus.ts` | Adicionar `botConnected: boolean` ao retorno |
| `src/components/ExtensionBanner.tsx` | Usar `botConnected` para `isActive`, novo estado visual no badge |
