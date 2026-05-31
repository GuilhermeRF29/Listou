import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Note: relies on env variable if needed.

  // API Routes
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
         return res.status(400).json({ error: "Missing imageBase64" });
      }

      // Convert base64 to parts format required by Gemini REST/SDK
      // The imageBase64 should not contain the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const prompt = `
        Analise a imagem deste produto e retorne os dados no formato JSON abaixo.
        Se não conseguir identificar alguma informação, retorne null.
        Formato obrigatório (somente JSON, sem markdown):
        {
          "name": "Nome do Produto",
          "brand": "Marca (se houver)",
          "category": "Uma categoria lógica (ex: Bebidas, Laticínios, Limpeza, etc)",
          "size": "Tamanho/Quantidade",
          "emoji": "Um unico emoji que represente o alimento perfeitamente",
          "nutrition": {
             "energy-kcal_100g": "kcal (em número)",
             "carbohydrates_100g": "Carboidratos (em número)",
             "proteins_100g": "Proteínas (em número)",
             "fat_100g": "Gorduras Totais (em número)",
             "saturated-fat_100g": "Gordura Saturada (em número)",
             "fiber_100g": "Fibras (em número)",
             "sodium_100g": "Sódio (em número mg)",
             "sugars_100g": "Açúcares (em número)"
          }
        }
      `;

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
        ]
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
         const parsed = JSON.parse(responseText);
         res.json({ result: parsed });
      } catch(e) {
         console.log("Failed to parse JSON res:", responseText);
         res.status(500).json({ error: "Failed to parse API response as JSON", raw: responseText });
      }

    } catch (error: any) {
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
