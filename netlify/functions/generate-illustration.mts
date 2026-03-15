import type { Context } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { prompt, heroAvatars } = body;

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];

    (heroAvatars || []).forEach((avatar: string) => {
      parts.push({
        inlineData: {
          data: avatar.split(',')[1],
          mimeType: 'image/jpeg'
        }
      });
    });

    const refNote = heroAvatars?.length > 0
      ? ` Maintain the exact appearance of the children from the provided reference images as the main characters.`
      : '';
    parts.push({
      text: `Professional artistic book illustration: ${prompt}.${refNote} High artistic quality, vivid lighting, ensure character consistency.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return new Response(JSON.stringify({
          imageUrl: `data:image/png;base64,${part.inlineData.data}`
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Image generation failed - no image in response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Illustration generation failed:", error);
    return new Response(JSON.stringify({ error: error.message || "Image generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
