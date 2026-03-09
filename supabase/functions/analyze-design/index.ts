import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert front-end developer and UI analyst. You receive a screenshot of a webpage or UI design. Your job is to analyze it and generate a complete, production-ready website using semantic HTML5, CSS3, and Bootstrap 5.

ANALYSIS STEPS:
1. Identify the visual hierarchy and structural sections (navbar, hero, features, about, testimonials, pricing, contact, footer, etc.)
2. Detect UI elements: headings, paragraphs, images, icons, buttons, links, inputs, cards
3. Understand spatial relationships, alignment, spacing, and grouping
4. Extract design properties: color palette (as hex codes), font styles, padding, margins, section spacing

OUTPUT FORMAT:
Return a JSON object with exactly this structure:
{
  "analysis": {
    "sections": ["list of detected sections"],
    "colorPalette": ["#hex1", "#hex2", ...],
    "fonts": ["font names detected or suggested"],
    "summary": "Brief description of the design"
  },
  "html": "Complete index.html content with Bootstrap 5 CDN, proper semantic HTML, and inline references to style.css",
  "css": "Complete style.css content with extracted colors, fonts, spacing, and responsive overrides"
}

RULES:
- Use Bootstrap 5 CDN (https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css)
- Use Bootstrap Icons CDN for icons
- Use semantic HTML5 tags (header, nav, main, section, article, footer)
- Use Bootstrap grid (container, row, col-*) for layout
- Make it fully responsive
- Use placeholder images from https://placehold.co/ matching approximate dimensions
- Extract and use actual colors from the design
- Generate clean, well-commented code
- The HTML should reference style.css for custom styles
- Include Google Fonts link if specific fonts are detected
- IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this UI design screenshot and generate the complete HTML and CSS code. Return ONLY the JSON object as specified.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON from the response (handle potential markdown wrapping)
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in the text
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-design error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
