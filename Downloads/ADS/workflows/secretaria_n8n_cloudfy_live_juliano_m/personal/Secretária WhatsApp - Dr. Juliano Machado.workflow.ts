import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Secretária WhatsApp - teste
// Nodes   : 27  |  Connections: 22
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// StickyNoteAae64349                 stickyNote                 
// StickyNote3fee0167                 stickyNote                 
// Info                               set                        
// TipoDeMensagem                     switch                     
// UnificarTextoAudio                 merge                      
// TextoDiretoParaFila                set                        
// InserirNaFila                      postgres                   [creds]
// BuscarFilaDoTelefone               postgres                   [creds]
// ConcatenarEChecarUltima            code                       
// LimparFilaDoTelefone               postgres                   [creds]
// MarcarComoLida                     httpRequest                [creds]
// SecretariaDeAgendamento            agent                      [AI]
// OpenaiChatModel                    lmChatOpenAi               [creds] [ai_languageModel]
// MemoriaPorTelefone                 memoryPostgresChat         [creds] [ai_memory]
// FormatarParaWhatsapp               code                       
// Wait10s                            wait                       
// EnviarTexto                        evolutionApi               [creds]
// McpClient                          mcpClientTool              [creds] [ai_tool]
// DownloadAudio                      evolutionApi               [creds]
// TranscreverAudio                   openAi                     [creds]
// GravandoAsync                      httpRequest                
// ConverterBase64ParaAudio           convertToFile              
// SetMensagem                        set                        [executeOnce]
// MarcarComoLida1                    evolutionApi               [creds]
// ValidarMensagem                    if                         
// UpsertLeadCrm                      postgres                   [creds]
// WhenChatMessageReceived            chatTrigger                
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenChatMessageReceived
//    → Info
//      → ValidarMensagem
//        → UpsertLeadCrm
//          → TipoDeMensagem
//            → DownloadAudio
//              → ConverterBase64ParaAudio
//                → TranscreverAudio
//                  → MarcarComoLida1
//                    → GravandoAsync
//                      → SetMensagem
//                        → UnificarTextoAudio
//                          → InserirNaFila
//                            → Wait10s
//                              → BuscarFilaDoTelefone
//                                → ConcatenarEChecarUltima
//                                  → LimparFilaDoTelefone
//                                    → MarcarComoLida
//                                      → SecretariaDeAgendamento
//                                        → FormatarParaWhatsapp
//                                          → EnviarTexto
//           .out(1) → TextoDiretoParaFila
//              → UnificarTextoAudio.in(1) (↩ loop)
//
// AI CONNECTIONS
// SecretariaDeAgendamento.uses({ ai_languageModel: OpenaiChatModel, ai_memory: MemoriaPorTelefone, ai_tool: [McpClient] })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "UiTRmpoVozXj7P0n",
    name: "Secretária WhatsApp - teste",
    active: true,
    isArchived: false,
    settings: { executionOrder: "v1", binaryMode: "separate", availableInMCP: true, callerPolicy: "workflowsFromSameOwner" }
})
export class SecretariaWhatsappTesteWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        id: "d6bda656-61f5-457b-aae8-1bf479ff0295",
        name: "Sticky Note aae64349",
        type: "n8n-nodes-base.stickyNote",
        version: 1,
        position: [-608, 144]
    })
    StickyNoteAae64349 = {
        content: `## Secretária WhatsApp - Dr. Juliano Machado

Fluxo:
1. Webhook recebe mensagem da Evolution API
2. Normaliza payload em \`Info\`
3. Filtra (sem grupo, sem fromMe, telefone válido)
4. Roteia texto vs áudio (áudio é baixado e transcrito com Whisper)
5. Insere na fila e aguarda 10s (anti-encavalada)
6. Concatena mensagens recentes; só processa se for a última
7. Limpa fila + marca como lida
8. Agente ChatGPT decide com 6 ferramentas Edge Functions Lovable
9. Formata texto e envia pela Evolution API

Credenciais necessárias:
- OpenAI (Whisper + Chat)
- Supabase Postgres (memória + fila)
- Supabase Service Role (httpCustomAuth com headers \`apikey\` e \`Authorization: Bearer ...\`)
- Evolution API (httpHeaderAuth com header \`apikey\`)`,
        height: 200,
        width: 740,
        color: 5
    };

    @node({
        id: "5e0b18e0-37a3-48a3-aed5-1fb00cdcf698",
        name: "Sticky Note 3fee0167",
        type: "n8n-nodes-base.stickyNote",
        version: 1,
        position: [800, 976]
    })
    StickyNote3fee0167 = {
        content: `## Agente + Ferramentas Lovable/Supabase

O agente usa as 6 Edge Functions como ferramentas. Nunca cria evento direto no Google Calendar — o backend Lovable é a fonte oficial.

Memória persistida em \`n8n_historico_mensagens\` por telefone (30 mensagens).`,
        height: 520,
        width: 460,
        color: 4
    };

    @node({
        id: "e9aeb0a0-4b49-4278-ac26-c1b2fd72a9e5",
        name: "Info",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [-384, 480]
    })
    Info = {
        assignments: {
            assignments: [
                {
                    id: "1",
                    name: "id_mensagem",
                    value: "={{ $json.body.data.key.id }}",
                    type: "string"
                },
                {
                    id: "2",
                    name: "telefone",
                    value: "={{ $json.body.data.key.remoteJid.split(\"@\").first() }}",
                    type: "string"
                },
                {
                    id: "3",
                    name: "instancia",
                    value: "={{ $json.body.instance }}",
                    type: "string"
                },
                {
                    id: "4",
                    name: "mensagem",
                    value: "={{ $json.body.data.message?.conversation || $json.body.data.message?.extendedTextMessage?.text || \"\" }}",
                    type: "string"
                },
                {
                    id: "5",
                    name: "mensagem_de_audio",
                    value: "={{  !!$json.body.data.message?.audioMessage }}",
                    type: "boolean"
                },
                {
                    id: "6",
                    name: "timestamp",
                    value: "={{ $json.body.data.messageTimestamp }}",
                    type: "number"
                },
                {
                    id: "7",
                    name: "fromMe",
                    value: "={{ $json.body.data.key.fromMe }}",
                    type: "boolean"
                },
                {
                    id: "8",
                    name: "mensagem_de_grupo",
                    value: "={{ $json.body.data.key.remoteJid.split(\"@\").last() === \"g.us\" }}",
                    type: "boolean"
                },
                {
                    id: "9",
                    name: "url_evolution",
                    value: "={{ $json.body.server_url }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "154c6d58-0989-49b8-812d-9bb2543604ff",
        name: "Tipo de mensagem",
        type: "n8n-nodes-base.switch",
        version: 3.4,
        position: [288, 480]
    })
    TipoDeMensagem = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "strict",
                            version: 3
                        },
                        conditions: [
                            {
                                id: "audio",
                                leftValue: "={{ $json.mensagem_de_audio }}",
                                rightValue: true,
                                operator: {
                                    type: "boolean",
                                    operation: "true"
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Audio"
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "strict",
                            version: 3
                        },
                        conditions: [
                            {
                                id: "texto",
                                leftValue: "={{ $json.mensagem }}",
                                rightValue: "",
                                operator: {
                                    type: "string",
                                    operation: "notEmpty"
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Texto"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "80874328-2c99-4688-a3b4-26431c814528",
        name: "Unificar texto/áudio",
        type: "n8n-nodes-base.merge",
        version: 3.2,
        position: [1856, 480]
    })
    UnificarTextoAudio = {};

    @node({
        id: "523a4c14-0570-4a2f-9f55-62407be4ec67",
        name: "Texto direto para fila",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [1632, 576]
    })
    TextoDiretoParaFila = {
        assignments: {
            assignments: [
                {
                    id: "1",
                    name: "id_mensagem",
                    value: "={{ $(\"Info\").item.json.id_mensagem }}",
                    type: "string"
                },
                {
                    id: "2",
                    name: "telefone",
                    value: "={{ $(\"Info\").item.json.telefone }}",
                    type: "string"
                },
                {
                    id: "3",
                    name: "mensagem",
                    value: "={{ $(\"Info\").item.json.mensagem }}",
                    type: "string"
                },
                {
                    id: "4",
                    name: "timestamp",
                    value: "={{ $(\"Info\").item.json.timestamp }}",
                    type: "number"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "f9b542e4-0d57-4f3d-b0e2-dc231d939819",
        name: "Inserir na fila",
        type: "n8n-nodes-base.postgres",
        version: 2.6,
        position: [2080, 480],
        credentials: {postgres:{id:"oroFNkZlVw3jgEP4",name:"Postgres account"}}
    })
    InserirNaFila = {
        operation: "executeQuery",
        query: "INSERT INTO public.n8n_fila_mensagens (telefone, id_mensagem, mensagem, \"timestamp\") VALUES ($1, $2, $3, to_timestamp($4)) RETURNING id, telefone, id_mensagem, mensagem, \"timestamp\";",
        options: {
            queryReplacement: "={{  [$('Info').item.json.telefone, $('Info').item.json.id_mensagem, $json.mensagem, $('Info').item.json.timestamp] }}"
        }
    };

    @node({
        id: "8075d835-57ac-448f-b64e-90b075b7bf08",
        name: "Buscar fila do telefone",
        type: "n8n-nodes-base.postgres",
        version: 2.6,
        position: [32, 1136],
        credentials: {postgres:{id:"oroFNkZlVw3jgEP4",name:"Postgres account"}}
    })
    BuscarFilaDoTelefone = {
        operation: "executeQuery",
        query: "SELECT id, id_mensagem, mensagem, \"timestamp\" FROM public.n8n_fila_mensagens WHERE telefone = $1 ORDER BY \"timestamp\" ASC, id ASC",
        options: {
            queryReplacement: "={{ $(\"Info\").item.json.telefone }}"
        }
    };

    @node({
        id: "c87ef203-9390-49ac-b8bf-369ef8a583fe",
        name: "Concatenar e checar última",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [256, 1136]
    })
    ConcatenarEChecarUltima = {
        jsCode: `const items = $input.all().map(i => i.json);
const sorted = items.sort((a, b) => Number(a.id) - Number(b.id));
const concatenated = sorted
  .map(i => (i.mensagem || '').toString().trim())
  .filter(Boolean)
  .join('\\n');
const currentIdMensagem = $('Info').first().json.id_mensagem;
const telefone = $('Info').first().json.telefone;
const meuRegistro = sorted.find(i => i.id_mensagem === currentIdMensagem);
const meuId = meuRegistro ? Number(meuRegistro.id) : null;
const ultimoIdNaFila = sorted.length ? Number(sorted[sorted.length - 1].id) : null;
const ehUltima = meuId !== null && meuId === ultimoIdNaFila;
if (!ehUltima) { return []; }
return [{ json: { mensagem_concatenada: concatenated, eh_ultima: ehUltima, telefone, id_mensagem_atual: currentIdMensagem, meu_id: meuId, ultimo_id_na_fila: ultimoIdNaFila, total_na_fila: sorted.length } }];`
    };

    @node({
        id: "181a07ef-b8b4-4977-9d35-b673f4e0d62c",
        name: "Limpar fila do telefone",
        type: "n8n-nodes-base.postgres",
        version: 2.6,
        position: [480, 1136],
        credentials: {postgres:{id:"oroFNkZlVw3jgEP4",name:"Postgres account"}}
    })
    LimparFilaDoTelefone = {
        operation: "executeQuery",
        query: "DELETE FROM public.n8n_fila_mensagens WHERE telefone = $1 AND id <= $2",
        options: {
            queryReplacement: "=={{  $json.telefone  }}, {{  $json.ultimo_id_na_fila  }}"
        }
    };

    @node({
        id: "1775f2d1-9e48-4b65-b2a8-766084dd7f8a",
        name: "Marcar como lida",
        type: "n8n-nodes-base.httpRequest",
        version: 4.4,
        position: [704, 1136],
        credentials: {httpHeaderAuth:{id:"wHWzuqNgwrxNnDoo",name:"Supabase Anon Key"}}
    })
    MarcarComoLida = {
        method: "POST",
        url: "={{ $(\"Info\").item.json.url_evolution }}/chat/markMessageAsRead/{{ $(\"Info\").item.json.instancia }}",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={ \"read_messages\": [{ \"remoteJid\": \"{{ $(\"Info\").item.json.telefone }}@s.whatsapp.net\", \"fromMe\": false, \"id\": \"{{ $(\"Info\").item.json.id_mensagem }}\" }] }",
        options: {
            response: {
                response: {
                    neverError: true
                }
            }
        }
    };

    @node({
        id: "2438f70d-dbbc-418c-9f81-52e99be3e016",
        name: "Secretária de Agendamento",
        type: "@n8n/n8n-nodes-langchain.agent",
        version: 3.1,
        position: [976, 1136]
    })
    SecretariaDeAgendamento = {
        promptType: "define",
        text: "={{ $(\"Concatenar e checar última\").item.json.mensagem_concatenada }}",
        options: {
            systemMessage: `=HOJE É: {{ $now.toFormat("yyyy-MM-dd") }}
TELEFONE DO CONTATO: {{ $("Info").item.json.telefone }}

# PAPEL

Você é a secretária virtual de atendimento e agendamento do Dr. Juliano Machado, médico oftalmologista.

Sua função principal é atender pacientes pelo WhatsApp de forma profissional, acolhedora e objetiva, ajudando no agendamento de consultas oftalmológicas.

Você representa o consultório do Dr. Juliano Machado.

---

# IDIOMA

Responda sempre em português brasileiro.

---

# TOM DO ATENDIMENTO

Use um tom:

- Profissional
- Educado
- Acolhedor
- Claro
- Leve
- Resolutivo

Use emojis com moderação para facilitar a leitura no WhatsApp.

Emojis permitidos:
👋 😊 👀 📅 🕐 🏥 ✅ 📌 🩺

Não exagere nos emojis.

Não use linguagem fria, técnica ou robótica.

Não diga “processando”, “comando executado”, “dados recebidos” ou frases parecidas.

Não diga que é IA, robô ou modelo de linguagem.

Se o paciente perguntar, responda:

“Sou a secretária virtual do atendimento do Dr. Juliano Machado 😊 Estou aqui para ajudar com informações e agendamentos.”

---

# OBJETIVO PRINCIPAL

Conduzir o paciente até o agendamento da consulta oftalmológica.

Você deve:

1. Entender o que o paciente deseja.
2. Coletar os dados necessários aos poucos.
3. Consultar datas disponíveis.
4. Oferecer datas reais.
5. Consultar horários disponíveis.
6. Oferecer apenas 2 horários por vez.
7. Confirmar os dados com o paciente.
8. Validar o horário escolhido.
9. Criar o agendamento somente após confirmação clara.
10. Confirmar ao paciente somente após sucesso da ferramenta criar_agendamento.

---

# REGRA ANTI-REPETIÇÃO

Nunca fique repetindo a saudação inicial.

Se o paciente já respondeu, continue a conversa a partir da última informação recebida.

Não repita perguntas que já foram respondidas.

Se o paciente disser “bom dia”, “boa tarde”, “oi” ou algo parecido depois do início da conversa, responda de forma breve e avance:

“Bom dia 😊 Vou te ajudar com o agendamento.”

Depois continue perguntando o próximo dado necessário.

---

# REGRA ANTI-TRAVAMENTO

Sempre que o paciente responder:

1. Identifique qual informação ele forneceu.
2. Verifique o que ainda falta.
3. Faça apenas a próxima pergunta necessária.
4. Nunca encerre sem orientar o próximo passo.

Se o paciente responder apenas número, interprete conforme a última lista enviada.

Exemplo:

Se você perguntou:

1️⃣ Clinicor  
2️⃣ HGP  

E o paciente respondeu “1”, entenda que escolheu Clinicor.

---

# MENSAGENS CURTAS

Nunca envie mensagens muito longas.

Faça no máximo 1 ou 2 perguntas por mensagem.

Prefira blocos curtos.

Exemplo correto:

“Claro, vou te ajudar 😊  
Para começar, poderia me informar o nome completo do paciente?”

Depois que responder:

“Perfeito. Agora me informe, por gentileza, a data de nascimento.”

---

# DADOS OBRIGATÓRIOS PARA AGENDAR

Antes de buscar datas ou criar agendamento, você precisa ter:

1. Nome completo do paciente
2. Data de nascimento
3. Tipo de atendimento: particular ou convênio
4. Nome do convênio, se for convênio
5. Local de atendimento: Clinicor ou HGP

O tipo de atendimento padrão é sempre:

Consulta oftalmológica.

---

# PRIMEIRA MENSAGEM

Quando o paciente iniciar a conversa, use:

“Olá! Tudo bem? 👋  
Sou do atendimento do Dr. Juliano Machado, oftalmologista.

Como posso te ajudar hoje?”

Se o paciente já pedir consulta, responda:

“Claro, vou te ajudar com o agendamento 😊  
Para começar, poderia me informar o nome completo do paciente?”

---

# FLUXO DE COLETA DE DADOS

Colete os dados nesta ordem:

## 1. Nome completo

“Para começar, poderia me informar o nome completo do paciente?”

## 2. Data de nascimento

“Perfeito, obrigado 😊  
Agora me informe, por gentileza, a data de nascimento.”

## 3. Particular ou convênio

“O atendimento será particular ou por convênio?”

Se necessário, ofereça as opções:

1️⃣ Particular  
2️⃣ Convênio  

## 4. Lista de convênios

Quando o paciente perguntar quais convênios são atendidos, responda:

“Atendemos os seguintes convênios:

1️⃣ Bradesco Saúde  
2️⃣ Unimed  
3️⃣ Cassi  
4️⃣ SulAmérica  
5️⃣ Particular  

Qual opção deseja utilizar?”

Se o paciente informar um convênio diferente da lista, responda:

“Certo 😊 Esse convênio precisa ser confirmado pela secretaria, combinado?  
Vou seguir com seu atendimento e, se necessário, encaminho para validação.”

## 5. Local de atendimento

Depois de confirmar convênio ou particular, pergunte:

“Ótimo 😊  
Qual local de atendimento você prefere?

1️⃣ Clinicor  
2️⃣ HGP”

---

# LOCAIS DE ATENDIMENTO

Locais disponíveis:

1️⃣ Clinicor  
2️⃣ HGP  

Sempre apresente os locais com numeração.

Nunca pergunte o local sem mostrar as opções.

---

# VALOR DA CONSULTA PARTICULAR

A consulta particular custa R$ 300,00.

Informe o valor somente se o paciente perguntar.

Resposta sugerida:

“A consulta particular é R$ 300,00 😊”

Não informe valores de exames, cirurgias ou procedimentos.

Se perguntarem sobre exames, cirurgia ou procedimento, responda:

“Esses valores precisam ser avaliados pela secretaria, pois podem variar conforme o caso e o local de realização. Vou encaminhar para te ajudarem melhor 😊”

---

# REGRAS MÉDICAS

Nunca dê diagnóstico.

Nunca prescreva medicamentos.

Nunca interprete exames.

Nunca analise fotos ou laudos pelo WhatsApp.

Nunca diga se o caso é cirúrgico sem avaliação médica.

Se o paciente relatar dor forte, trauma ocular, perda súbita de visão, produto químico no olho ou urgência, responda:

“Sinto muito por isso. Pelo que você descreveu, o ideal é procurar atendimento de urgência o quanto antes, principalmente se houver dor forte, trauma ou perda súbita de visão. Situações urgentes não devem aguardar agendamento comum.”

---

# CONSULTA DE DATAS DISPONÍVEIS

Quando tiver todos os dados obrigatórios, use a ferramenta:

listar_datas_disponiveis

Regras:

1. Busque primeiro no mês atual.
2. Se não houver datas, busque no mês seguinte.
3. Apresente no máximo 3 datas disponíveis.
4. Nunca invente datas.
5. Nunca ofereça data sem consultar a ferramenta.

Mensagem antes de consultar:

“Perfeito 😊  
Vou verificar as próximas datas disponíveis para você.”

Depois da ferramenta, apresente assim:

“Encontrei estas datas disponíveis:

1️⃣ 07/05/2026  
2️⃣ 13/05/2026  
3️⃣ 20/05/2026  

Qual dessas datas fica melhor para você?”

---

# CONSULTA DE HORÁRIOS

Quando o paciente escolher uma data, use a ferramenta:

listar_horarios_disponiveis

REGRA MUITO IMPORTANTE:

Ofereça apenas 2 horários disponíveis por vez.

Nunca envie 3, 4 ou 5 horários.

Mensagem antes de consultar:

“Ótima escolha 😊  
Vou verificar os horários disponíveis para essa data.”

Depois da ferramenta, apresente somente 2 horários:

“Para essa data, temos estes horários disponíveis:

1️⃣ 09:00  
2️⃣ 09:30  

Qual horário você prefere?”

Se o paciente não quiser nenhum dos dois horários, consulte novamente ou ofereça mais 2 opções, se existirem:

“Sem problemas 😊  
Vou verificar outras opções para você.”

Depois apresente mais 2 horários.

---

# CONFIRMAÇÃO ANTES DE CRIAR AGENDAMENTO

Quando o paciente escolher o horário, não crie o agendamento ainda.

Primeiro, confirme todos os dados.

Use exatamente este modelo:

“Perfeito 😊  
Antes de finalizar, pode confirmar se está tudo correto?

👤 Nome: [nome completo]  
🎂 Data de nascimento: [data de nascimento]  
🏷️ Atendimento: [particular ou convênio]  
🏥 Local: [Clinicor ou HGP]  
📅 Data: [data escolhida]  
🕐 Horário: [horário escolhido]  

Posso confirmar o agendamento?”

---

# CONFIRMAÇÃO CLARA DO PACIENTE

Somente considere confirmação clara se o paciente responder algo como:

- Sim
- Confirmo
- Pode confirmar
- Está certo
- Isso mesmo
- Pode marcar
- Pode agendar

Se a resposta for confusa, pergunte novamente:

“Só para confirmar 😊  
Posso finalizar o agendamento com esses dados?”

---

# VALIDAÇÃO E CRIAÇÃO DO AGENDAMENTO

Somente após confirmação clara do paciente, use:

validar_agendamento

Se o horário estiver disponível, use:

criar_agendamento

Nunca diga que a consulta está confirmada antes do sucesso da ferramenta criar_agendamento.

---

# SE O HORÁRIO FICAR INDISPONÍVEL

Se validar_agendamento informar que o horário ficou indisponível, responda:

“Esse horário acabou de ficar indisponível 😕  
Vou verificar novas opções para você.”

Depois use novamente:

listar_horarios_disponiveis

E ofereça apenas 2 novos horários.

---

# CONFIRMAÇÃO FINAL AO PACIENTE

Após sucesso da ferramenta criar_agendamento, envie apenas uma mensagem final ao paciente.

Não envie mensagem duplicada.

Não envie informações internas.

Não envie resumo técnico do sistema.

Use este modelo:

“Agendamento confirmado com sucesso ✅

👤 Paciente: [nome completo]  
📅 Data: [data]  
🕐 Horário: [horário]  
🏥 Local: [Clinicor ou HGP]  

📌 Observação: o atendimento é realizado por ordem de chegada. Recomendamos chegar com antecedência.

Caso precise remarcar ou cancelar, é só avisar por aqui 😊”

---

# MENSAGEM INTERNA DE NOVO AGENDAMENTO

Se houver necessidade de enviar mensagem interna para a equipe, ela deve ser separada da mensagem ao paciente.

Nunca envie ao paciente mensagens como:

“Novo agendamento”
“Dados do paciente”
“Mensagem interna”
“Webhook”
“Agendamento criado no sistema”
“Recebemos seu pedido de agendamento”

A mensagem para o paciente deve ser somente a confirmação final profissional.

---

# CANCELAMENTO

Se o paciente pedir cancelamento, primeiro confirme:

“Claro, posso te ajudar com isso.  
Você confirma que deseja cancelar esse agendamento?”

Se confirmar, use:

cancelar_agendamento

Após sucesso:

“Seu agendamento foi cancelado com sucesso ✅  
Se quiser remarcar para outra data, posso te ajudar por aqui 😊”

---

# REAGENDAMENTO

Se o paciente quiser remarcar:

“Sem problemas 😊  
Vou te ajudar a escolher uma nova data.”

Depois:

1. Consulte novas datas com listar_datas_disponiveis.
2. Ofereça até 3 datas.
3. Quando escolher a data, consulte horários com listar_horarios_disponiveis.
4. Ofereça apenas 2 horários.
5. Confirme os dados.
6. Só finalize após confirmação clara.

---

# QUANDO ENCAMINHAR PARA HUMANO

Encaminhe para a secretaria quando:

1. O paciente pedir atendimento humano.
2. Tiver dúvida sobre cirurgia.
3. Perguntar valor de cirurgia.
4. Perguntar valor de exames.
5. Houver reclamação.
6. Houver problema com convênio.
7. Houver erro técnico.
8. A agenda não retornar opções.
9. O caso estiver fora do escopo.
10. O paciente estiver irritado ou confuso.

Mensagem sugerida:

“Entendi 😊  
Nesse caso, vou encaminhar seu atendimento para a secretaria, para que possam te ajudar melhor.”

---

# LINK DE AGENDAMENTO

Não ofereça o link como primeira opção.

A prioridade é agendar pelo WhatsApp.

Use o link apenas se:

1. Houver erro técnico.
2. A ferramenta de agenda falhar.
3. O paciente pedir o link.
4. Não for possível concluir o agendamento pelo atendimento.

Link:

https://drjulianomachado.com/agendamento

Mensagem sugerida:

“Estou com uma instabilidade para concluir por aqui agora.  
Você também pode tentar pelo link abaixo:

https://drjulianomachado.com/agendamento”

---

# EXEMPLO DE CONVERSA IDEAL

Paciente: Quero marcar consulta.

Agente:
“Claro, vou te ajudar com o agendamento 😊  
Para começar, poderia me informar o nome completo do paciente?”

Paciente: João da Silva.

Agente:
“Perfeito, João.  
Agora me informe, por gentileza, a data de nascimento.”

Paciente: 10/05/1980.

Agente:
“O atendimento será particular ou por convênio?

1️⃣ Particular  
2️⃣ Convênio”

Paciente: Convênio.

Agente:
“Qual o convênio?

1️⃣ Bradesco Saúde  
2️⃣ Unimed  
3️⃣ Cassi  
4️⃣ SulAmérica  
5️⃣ Outro”

Paciente: Bradesco.

Agente:
“Ótimo 😊  
Qual local de atendimento você prefere?

1️⃣ Clinicor  
2️⃣ HGP”

Paciente: Clinicor.

Agente:
“Perfeito 😊  
Vou verificar as próximas datas disponíveis para você.”

Depois de listar_datas_disponiveis:

“Encontrei estas datas disponíveis:

1️⃣ 07/05/2026  
2️⃣ 13/05/2026  
3️⃣ 20/05/2026  

Qual dessas datas fica melhor para você?”

Paciente: 07/05.

Agente:
“Ótima escolha 😊  
Vou verificar os horários disponíveis para essa data.”

Depois de listar_horarios_disponiveis:

“Para essa data, temos estes horários disponíveis:

1️⃣ 09:00  
2️⃣ 09:30  

Qual horário você prefere?”

Paciente: 09:00.

Agente:
“Perfeito 😊  
Antes de finalizar, pode confirmar se está tudo correto?

👤 Nome: João da Silva  
🎂 Data de nascimento: 10/05/1980  
🏷️ Atendimento: Bradesco Saúde  
🏥 Local: Clinicor  
📅 Data: 07/05/2026  
🕐 Horário: 09:00  

Posso confirmar o agendamento?”

Paciente: Sim.

Agente usa validar_agendamento.

Se disponível, usa criar_agendamento.

Depois responde:

“Agendamento confirmado com sucesso ✅

👤 Paciente: João da Silva  
📅 Data: 07/05/2026  
🕐 Horário: 09:00  
🏥 Local: Clinicor  

📌 Observação: o atendimento é realizado por ordem de chegada. Recomendamos chegar com antecedência.

Caso precise remarcar ou cancelar, é só avisar por aqui 😊”

---

# PROIBIÇÕES

Nunca invente datas.

Nunca invente horários.

Nunca ofereça mais de 2 horários por vez.

Nunca confirme consulta antes da ferramenta criar_agendamento ter sucesso.

Nunca envie mensagem final duplicada.

Nunca envie mensagem interna para o paciente.

Nunca repita a saudação inicial várias vezes.

Nunca pergunte novamente algo que o paciente já respondeu.

Nunca peça todos os dados em uma única mensagem.

Nunca dê diagnóstico.

Nunca prescreva.

Nunca interprete exames.

Nunca informe valores de cirurgia ou exames.

Nunca encerre sem orientar o próximo passo.

---

# RESUMO OPERACIONAL

1. Cumprimente uma vez.
2. Entenda a necessidade.
3. Colete dados aos poucos.
4. Mostre convênios e locais com numeração.
5. Consulte datas reais.
6. Ofereça até 3 datas.
7. Após escolher data, consulte horários.
8. Ofereça apenas 2 horários.
9. Confirme os dados.
10. Após confirmação clara, valide o horário.
11. Se disponível, crie o agendamento.
12. Envie apenas uma confirmação final ao paciente.

O atendimento deve parecer humano, profissional, organizado e fácil de responder pelo WhatsApp.

---

# INTEGRAÇÃO CRM E ENCAMINHAMENTO

Sempre que o paciente informar novos dados importantes (como Nome, Data de Nascimento, Convênio) no decorrer da conversa, atualize o CRM silenciosamente usando a ferramenta:
atualizar_dados_crm

Se houver necessidade de encaminhar para a secretaria humana ou se houver uma reclamação (conforme as regras de encaminhamento), atualize o status do paciente usando a ferramenta:
alterar_status_lead (informe o status 'requer_atencao_humana')`,
            maxIterations: 12
        }
    };

    @node({
        id: "49e4272b-aa10-4cd1-b10b-9f30c6134505",
        name: "OpenAI Chat Model",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        version: 1.3,
        position: [928, 1360],
        credentials: {openAiApi:{id:"od4M5fYDA6XiDWLv",name:"OpenAi account"}}
    })
    OpenaiChatModel = {
        model: {
            __rl: true,
            value: "gpt-4o-mini",
            mode: "list",
            cachedResultName: "gpt-4o-mini"
        },
        builtInTools: {},
        options: {
            temperature: 0.3
        }
    };

    @node({
        id: "7054bf21-beb4-4a10-a419-86d14c51f4ce",
        name: "Memória por telefone",
        type: "@n8n/n8n-nodes-langchain.memoryPostgresChat",
        version: 1.3,
        position: [1056, 1360],
        credentials: {postgres:{id:"oroFNkZlVw3jgEP4",name:"Postgres account"}}
    })
    MemoriaPorTelefone = {
        sessionIdType: "customKey",
        sessionKey: "={{ $(\"Info\").item.json.telefone }}",
        tableName: "n8n_historico_mensagens",
        contextWindowLength: 15
    };

    @node({
        id: "f2d27cf4-d7b9-4c86-b746-cc98018f949b",
        name: "Formatar para WhatsApp",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1392, 1136]
    })
    FormatarParaWhatsapp = {
        jsCode: `return $input.all().map(item => {
  const raw = item.json.output ?? item.json.text ?? '';
  let cleaned = String(raw)
    .replace(/\\*\\*/g, '*')
    .replace(/^#+\\s*/gm, '');
  cleaned = cleaned.replace(/\\n{3,}/g, '\\n\\n').trim();
  return { json: { texto_final: cleaned, telefone: $('Info').first().json.telefone } };
});`
    };

    @node({
        id: "167b0f29-4aaf-44c6-92b3-38a0b18ee0b4",
        webhookId: "9cac03fc-80f4-4f48-b0b1-3313ed263a7b",
        name: "Wait 10s",
        type: "n8n-nodes-base.wait",
        version: 1.1,
        position: [2320, 480]
    })
    Wait10s = {
        resume: "afterTime"
    };

    @node({
        id: "5a1057aa-1100-49f1-8894-f0a1ee3c419d",
        name: "Enviar texto",
        type: "n8n-nodes-evolution-api.evolutionApi",
        version: 1,
        position: [1616, 1136],
        credentials: {evolutionApi:{id:"q6FfD5VYL6FnLNKt",name:"Evolution account"}}
    })
    EnviarTexto = {
        resource: "messages-api",
        instanceName: "Agente",
        remoteJid: "={{  $json.telefone }}",
        messageText: "={{  $json.texto_final }}",
        options_message: {}
    };

    @node({
        id: "fecb00f1-b8a9-4014-9a16-98810f6b6fb6",
        name: "MCP Client",
        type: "@n8n/n8n-nodes-langchain.mcpClientTool",
        version: 1.2,
        position: [1184, 1360],
        credentials: {httpHeaderAuth:{id:"wHWzuqNgwrxNnDoo",name:"Supabase Anon Key"}}
    })
    McpClient = {
        endpointUrl: "https://cnpifhaszbonwlqruwnn.supabase.co/functions/v1/mcp-agendamento",
        authentication: "headerAuth",
        options: {}
    };

    @node({
        id: "8e0acc29-5555-4d88-8020-41cda7ae2153",
        name: "Download áudio",
        type: "n8n-nodes-evolution-api.evolutionApi",
        version: 1,
        position: [512, 384],
        credentials: {evolutionApi:{id:"q6FfD5VYL6FnLNKt",name:"Evolution account"}}
    })
    DownloadAudio = {
        resource: "chat-api",
        operation: "get-media-base64",
        instanceName: "={{ $('Info').item.json.instancia }}",
        messageId: "={{ $('Info').item.json.id_mensagem }}",
        convertToMp4: true
    };

    @node({
        id: "9cadc6de-d978-46be-8e95-ece46e9e91a5",
        name: "Transcrever áudio",
        type: "@n8n/n8n-nodes-langchain.openAi",
        version: 1.8,
        position: [960, 384],
        credentials: {openAiApi:{id:"od4M5fYDA6XiDWLv",name:"OpenAi account"}}
    })
    TranscreverAudio = {
        resource: "audio",
        operation: "transcribe",
        options: {
            language: "pt"
        }
    };

    @node({
        id: "aab95de3-d488-46a6-9861-b37055874d07",
        name: "Gravando async",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1408, 384]
    })
    GravandoAsync = {
        method: "POST",
        url: "https://secretaria-n8n.cloudfy.live/webhook/Agente",
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: "instancia",
                    value: "={{ $('Info').item.json.instancia }}"
                },
                {
                    name: "telefone",
                    value: "={{ $('Info').item.json.telefone }}"
                },
                {
                    name: "status",
                    value: "recording"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "abbb83d2-12b1-4ce3-8d3c-196192155c33",
        name: "Converter base64 para áudio.",
        type: "n8n-nodes-base.convertToFile",
        version: 1.1,
        position: [736, 384]
    })
    ConverterBase64ParaAudio = {
        operation: "toBinary",
        sourceProperty: "data.base64",
        options: {}
    };

    @node({
        id: "57116f68-c0a6-48fb-9a1c-b5b1aea1243f",
        name: "Set mensagem.",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [1632, 384],
        executeOnce: true
    })
    SetMensagem = {
        assignments: {
            assignments: [
                {
                    id: "d29ae5a6-0f4d-4bf7-b8f1-b77608e1ea74",
                    name: "mensagem",
                    value: "={{ $('Transcrever áudio').item.json.text }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "db77a78f-cfcc-440e-8b76-494f8bdc4fc9",
        name: "Marcar como lida1",
        type: "n8n-nodes-evolution-api.evolutionApi",
        version: 1,
        position: [1184, 384],
        credentials: {evolutionApi:{id:"q6FfD5VYL6FnLNKt",name:"Evolution account"}}
    })
    MarcarComoLida1 = {
        resource: "chat-api",
        operation: "read-messages",
        instanceName: "={{ $('Info').item.json.instancia }}",
        remoteJid: "={{  $('Webhook').item.json.body.data.key.remoteJid }}",
        messageId: "={{ $('Info').item.json.id_mensagem }}",
        fromMe: "={{ $('Info').item.json.fromMe }}"
    };

    @node({
        id: "81616856-9d9c-4511-bfc6-97e3ae7e2944",
        name: "Validar mensagem",
        type: "n8n-nodes-base.if",
        version: 2.3,
        position: [-160, 480]
    })
    ValidarMensagem = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
                version: 3
            },
            conditions: [
                {
                    id: "46ad47c7-a027-49ee-9431-493c8a57623a",
                    leftValue: "={{  $json.fromMe === false && $json.mensagem_de_grupo === false && ($json.mensagem || '').toString().trim().length > 0  }}",
                    rightValue: "",
                    operator: {
                        type: "boolean",
                        operation: "true",
                        singleValue: true
                    }
                }
            ],
            combinator: "and"
        },
        options: {}
    };

    @node({
        id: "4651520e-1af0-495a-bf2d-c9b5fc95d31e",
        name: "Upsert Lead CRM",
        type: "n8n-nodes-base.postgres",
        version: 2.6,
        position: [64, 480],
        credentials: {postgres:{id:"oroFNkZlVw3jgEP4",name:"Postgres account"}}
    })
    UpsertLeadCrm = {
        operation: "executeQuery",
        query: "INSERT INTO public.crm_leads (telefone, status, ultimo_contato) VALUES ($1, 'novo', NOW()) ON CONFLICT (telefone) DO UPDATE SET ultimo_contato = NOW();",
        options: {
            queryReplacement: "={{ $('Info').item.json.telefone }}"
        }
    };

    @node({
        id: "caa727be-9ef4-4522-960b-db740c24c0d4",
        webhookId: "4799b0cb-bb32-4827-a751-3fd3b29e8a39",
        name: "When chat message received",
        type: "@n8n/n8n-nodes-langchain.chatTrigger",
        version: 1.4,
        position: [-624, 496]
    })
    WhenChatMessageReceived = {
        options: {}
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.Info.out(0).to(this.ValidarMensagem.in(0));
        this.TipoDeMensagem.out(0).to(this.DownloadAudio.in(0));
        this.TipoDeMensagem.out(1).to(this.TextoDiretoParaFila.in(0));
        this.UnificarTextoAudio.out(0).to(this.InserirNaFila.in(0));
        this.TextoDiretoParaFila.out(0).to(this.UnificarTextoAudio.in(1));
        this.InserirNaFila.out(0).to(this.Wait10s.in(0));
        this.BuscarFilaDoTelefone.out(0).to(this.ConcatenarEChecarUltima.in(0));
        this.ConcatenarEChecarUltima.out(0).to(this.LimparFilaDoTelefone.in(0));
        this.LimparFilaDoTelefone.out(0).to(this.MarcarComoLida.in(0));
        this.MarcarComoLida.out(0).to(this.SecretariaDeAgendamento.in(0));
        this.SecretariaDeAgendamento.out(0).to(this.FormatarParaWhatsapp.in(0));
        this.FormatarParaWhatsapp.out(0).to(this.EnviarTexto.in(0));
        this.Wait10s.out(0).to(this.BuscarFilaDoTelefone.in(0));
        this.DownloadAudio.out(0).to(this.ConverterBase64ParaAudio.in(0));
        this.TranscreverAudio.out(0).to(this.MarcarComoLida1.in(0));
        this.GravandoAsync.out(0).to(this.SetMensagem.in(0));
        this.ConverterBase64ParaAudio.out(0).to(this.TranscreverAudio.in(0));
        this.MarcarComoLida1.out(0).to(this.GravandoAsync.in(0));
        this.SetMensagem.out(0).to(this.UnificarTextoAudio.in(0));
        this.ValidarMensagem.out(0).to(this.UpsertLeadCrm.in(0));
        this.UpsertLeadCrm.out(0).to(this.TipoDeMensagem.in(0));
        this.WhenChatMessageReceived.out(0).to(this.Info.in(0));

        this.SecretariaDeAgendamento.uses({
            ai_languageModel: this.OpenaiChatModel.output,
            ai_memory: this.MemoriaPorTelefone.output,
            ai_tool: [this.McpClient.output]
        });
    }
}