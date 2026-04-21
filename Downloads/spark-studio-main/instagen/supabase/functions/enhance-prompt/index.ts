// supabase/functions/enhance-prompt/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `Você é um especialista em copywriting e design para redes sociais brasileiras.
Transforme a ideia do usuário em um briefing estruturado que será usado como input para uma IA geradora de imagens (Nano Banana).

REGRAS RÍGIDAS:
- Use português do Brasil, tom de voz adaptado à marca
- Incorpore os campos da brand: paleta, handle, público-alvo, palavras a evitar
- Para posts únicos, use o template SINGLE_POST abaixo
- Para carrosséis, use o template CAROUSEL com [SLIDE N] para cada slide
- Sempre inclua CTA no último slide mencionando o handle da marca
- Use CAIXA ALTA para headlines impactantes

TEMPLATE SINGLE_POST:
**Objetivo do Post:**
    * <1-2 frases sobre engajamento/conversão desejado>

**Headline:**
    * <TÍTULO EM CAIXA ALTA, 6-10 palavras>

**Corpo do Texto:**
    * <ponto 1 acionável>
    * <ponto 2>
    * <ponto 3>

**Elementos Visuais:**
    * <fotografia descrição>
    * <ícones específicos>
    * <layout e hierarquia>

**Call-to-Action (CTA):**
    * <instrução clara> @<handle>

**Composição Visual:**
    * <distribuição espacial no {width}x{height}>

TEMPLATE CAROUSEL (repete por slide):
[SLIDE 1]
**Headline:** <gancho>
**Corpo do Texto:** <1 linha>
**Elementos Visuais:** ...
**CTA:** Arraste para o lado e descubra

[SLIDE 2]
...

[SLIDE N]  (último, com CTA final + @handle)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const { mode, idea, brand, format, objective, approach, slideCount } = await req.json();

    if (!mode || !brand || !format) {
      return json({ error: "mode, brand e format são obrigatórios" }, 400);
    }

    const handle =
      brand.instagram_handle ||
      String(brand.name || "marca").toLowerCase().replace(/\s/g, "");

    const userPrompt = `
BRIEFING DO USUÁRIO:
- Ideia: ${idea ?? ""}
- Objetivo: ${objective ?? ""}
- Abordagem: ${approach || "livre"}
- Modo de criação: ${mode}
- Formato: ${format.name} (${format.width}x${format.height}, ${format.isCarousel ? "carrossel" : "post único"})
${format.isCarousel ? `- Número de slides: ${slideCount}` : ""}

MARCA:
- Nome: ${brand.name}
- Setor: ${brand.sector || "N/A"}
- Público: ${brand.target_audience || "N/A"}
- Tom de voz: ${brand.tone_of_voice || "profissional"}
- Handle: @${handle}
- Paleta: ${JSON.stringify(brand.brand_colors || {})}
- Palavras a evitar: ${(brand.words_to_avoid || []).join(", ")}

Gere o briefing seguindo EXATAMENTE o template correspondente.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Limite de requisições atingido. Tente novamente em instantes." }, 429);
      if (resp.status === 402) return json({ error: "Créditos da Lovable AI esgotados. Adicione créditos no workspace." }, 402);
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return json({ error: "Erro ao gerar briefing" }, 500);
    }

    const data = await resp.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content ?? "";

    return json({ enhancedPrompt });
  } catch (e) {
    console.error("enhance-prompt error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
