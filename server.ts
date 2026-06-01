import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function normalizeSize(size: string): string {
  let s = size.toLowerCase().trim()
  const patterns: [RegExp, string][] = [
    [/(\d+[\.,]?\d*)\s*(litro[s]?|l)\b/i, '$1L'],
    [/(\d+[\.,]?\d*)\s*(mililitro[s]?|ml)\b/i, '$1ml'],
    [/(\d+[\.,]?\d*)\s*(quilograma[s]?|quilo[s]?|kg)\b/i, '$1kg'],
    [/(\d+[\.,]?\d*)\s*(grama[s]?|g)\b/i, '$1g'],
    [/(\d+[\.,]?\d*)\s*(unidade[s]?|un)\b/i, '$1un'],
    [/(\d+[\.,]?\d*)\s*(metro[s]?|m)\b/i, '$1m'],
    [/(\d+[\.,]?\d*)\s*(centimetro[s]?|cm)\b/i, '$1cm'],
  ]
  for (const [regex, replacement] of patterns) {
    if (regex.test(s)) return s.replace(regex, replacement)
  }
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API Routes
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
         return res.status(400).json({ error: "Missing imageBase64" });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const prompt = `Você é um especialista em análise de produtos. Analise a imagem e extraia as informações EXATAS.

REGRAS IMPORTANTES:
1. Retorne APENAS JSON válido, sem markdown, sem comentários
2. "size" deve ser EXTREMAMENTE PRECISO: extraia o número e a unidade exatos da embalagem. Ex: "1L", "200g", "500ml", "1kg", "12un", "30m"
   - NUNCA use "1 litro" → use "1L"
   - NUNCA use "200 gramas" → use "200g"
   - NUNCA invente o size se não estiver visível → deixe vazio
3. "category" escolha entre: Bebidas, Laticínios, Padaria, Carnes, Hortifrúti, Limpeza, Higiene, Bebidas Alcoólicas, Enlatados, Congelados, Grãos, Massas, Temperos, Doces, Petiscos, Bebidas Não Alcoólicas, Matinais, Molhos, Outros
4. "emoji": emoji PERFEITO e ÚNICO que representa o produto
5. "nutrition": preencha SOMENTE se a tabela nutricional estiver VISÍVEL na imagem. Cada valor deve ser apenas o número (ex: "250", "3.5"). Deixe string vazia se não visível.

Formato JSON:
{
  "name": "Nome completo do produto",
  "brand": "Marca",
  "category": "Categoria",
  "size": "Tamanho exato",
  "emoji": "emoji",
  "nutrition": {
     "energy-kcal_100g": "250",
     "carbohydrates_100g": "30",
     "proteins_100g": "5",
     "fat_100g": "8",
     "saturated-fat_100g": "2",
     "fiber_100g": "1.5",
     "sodium_100g": "200",
     "sugars_100g": "10"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            }
          }
        ],
        config: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        }
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!responseText) {
        return res.status(500).json({ error: "IA não retornou dados. Tente outra foto." })
      }

      try {
         const parsed = JSON.parse(responseText);
         if (parsed.size) parsed.size = normalizeSize(parsed.size)
         res.json({ result: parsed });
      } catch(e) {
         console.log("Failed to parse JSON res:", responseText);
         res.status(500).json({ error: "Resposta inválida da IA. Tente novamente." });
      }

    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 429) {
        return res.status(429).json({ error: "Limite diário da IA atingido. Tente novamente amanhã." })
      }
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to process image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
