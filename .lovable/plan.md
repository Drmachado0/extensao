

# Suporte Aprimorado para Arquivos JSON do GrowBot

## Contexto

O formato JSON do GrowBot (ig-list-collector) contem objetos ricos com campos como `username`, `full_name`, `is_private`, `is_verified`, `followed_by_viewer`, e `id`. Atualmente o parser ja extrai o campo `username`, mas ignora todos os outros dados uteis. Arquivos podem ter 23.000+ entradas (divididos em partes), o que exige tratamento especial.

## Melhorias Planejadas

### 1. Parser aprimorado para formato GrowBot

Atualizar `parseFileContent` para detectar o formato GrowBot (presenca dos campos `is_private`, `full_name`, etc.) e retornar metadados adicionais alem dos usernames:
- Contagem total de perfis no arquivo
- Quantos perfis privados foram encontrados
- Quantos perfis publicos
- Quantos ja seguidos pelo viewer (`followed_by_viewer`)
- Filtrar automaticamente perfis privados (opcao configuravel)

### 2. Filtro de contas privadas

Ao detectar formato GrowBot, filtrar automaticamente contas com `is_private: true` pois nao faz sentido seguir contas privadas para engajamento. Mostrar ao usuario quantas foram filtradas.

### 3. Filtro de contas ja seguidas

Remover automaticamente contas com `followed_by_viewer: true` pois ja sao seguidas. Mostrar contagem ao usuario.

### 4. Info card aprimorado apos upload

Quando um arquivo GrowBot for detectado, mostrar informacoes mais detalhadas:
- Nome do arquivo
- Total de perfis no arquivo
- Perfis privados removidos
- Perfis ja seguidos removidos  
- Usernames validos para adicionar

### 5. Suporte a arquivos grandes (chunks)

Melhorar o parsing para lidar com arquivos de 23k+ entradas sem travar o navegador, processando em chunks com feedback visual.

---

## Detalhes Tecnicos

### Arquivo modificado
- `src/pages/Targets.tsx`

### Alteracoes na funcao parseFileContent

A funcao sera refatorada para retornar um objeto com metadados em vez de apenas um array de strings:

```text
interface ParseResult {
  usernames: string[];
  meta: {
    isGrowBot: boolean;
    totalInFile: number;
    privateFiltered: number;
    alreadyFollowingFiltered: number;
    dupsRemoved: number;
  } | null;
}
```

Logica de deteccao GrowBot:
- Se o JSON e um array de objetos com campo `username` E pelo menos um dos campos `is_private`, `full_name`, `followed_by_viewer` -> formato GrowBot detectado
- Filtrar `is_private === true` e `followed_by_viewer === true`
- Extrair apenas o `username` dos restantes

### Alteracoes no estado uploadInfo

Expandir para incluir os metadados do GrowBot:

```text
Estado atual: { total: number; dupsRemoved: number }
Novo estado: { total: number; dupsRemoved: number; isGrowBot: boolean; privateFiltered: number; alreadyFollowingFiltered: number; totalInFile: number }
```

### Alteracoes no JSX do info badge

Quando `isGrowBot === true`, mostrar badges adicionais:
- Badge verde: "Formato GrowBot detectado"
- Badge com contagem de privados filtrados (se > 0)
- Badge com contagem de ja seguidos filtrados (se > 0)

### Tratamento de arquivos grandes

Para arquivos com mais de 5000 entradas:
- Nao popular o textarea (ja implementado para > 500)
- Mostrar aviso de que a insercao sera feita em lotes
- Manter o Progress bar existente durante a insercao

### Texto do drop zone atualizado

Mudar de:
"Arraste um arquivo .txt ou .json ou clique para selecionar"

Para:
"Arraste um arquivo .txt ou .json (compativel com GrowBot) ou clique para selecionar"

