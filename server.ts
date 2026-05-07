import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

// Initialize Google Gen AI with the server's environment variable.
// This ensures the Gemini API Key NEVER touches the tablet/client.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const KILL_FEED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    kills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          victim: { type: Type.STRING, description: "The name of the player who was killed" },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
        },
        required: ["victim", "confidence"]
      }
    }
  },
  required: ["kills"]
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  const killsPath = path.join(process.cwd(), 'cs2_kills.json');
  const logPath = path.join(process.cwd(), 'cs2_kills.log');
  
  if (!fs.existsSync(killsPath)) {
    fs.writeFileSync(killsPath, JSON.stringify({ total_kills: 0, recent: [] }));
  }

  // --- HELPER to save kills ---
  const registerKills = (kills: any[]) => {
    try {
      const data = JSON.parse(fs.readFileSync(killsPath, 'utf-8'));
      const now = Date.now();
      const newItems: any[] = [];

      kills.forEach(kill => {
        const victim = typeof kill === 'string' ? kill : kill.victim;
        const confidence = kill.confidence || 1.0;

        // Duplicate Suppression: Ignore if same victim killed in last 5 seconds
        const isDuplicate = data.recent.some((k: any) => 
          k.victim === victim && (now - new Date(k.timestamp).getTime()) < 5000
        );

        if (!isDuplicate) {
          const killEntry = {
            victim,
            confidence,
            timestamp: new Date().toISOString()
          };
          newItems.push(killEntry);
          
          // Append to plain text log
          const logEntry = `[${killEntry.timestamp}] VICTIM: ${victim} | CONF: ${confidence.toFixed(2)}\n`;
          fs.appendFileSync(logPath, logEntry);
        }
      });

      if (newItems.length > 0) {
        data.total_kills += newItems.length;
        data.recent = [...newItems, ...data.recent].slice(0, 100);
        fs.writeFileSync(killsPath, JSON.stringify(data, null, 2));
        io.emit("kill-update", data); // Broadcast fresh data to tablets
      }
      return newItems.length;
    } catch (e) {
      console.error("Failed to register kills:", e);
      return 0;
    }
  };

  // API: Get current kills
  app.get("/api/kills", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(killsPath, 'utf-8'));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  // API: Get Config
  app.get("/api/config", (req, res) => {
    const configPath = path.join(process.cwd(), 'client', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        res.json(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
      } catch(e) {
        res.json({ player_name: 'LocalPlayer' });
      }
    } else {
      res.json({ player_name: 'LocalPlayer', crop: { top: 20, left: 75, width: 15, height: 15 } });
    }
  });

  // API: Python Agent pushes a screenshot for Server-Side AI Analysis
  app.post("/api/capture", async (req, res) => {
    const { screenshot, playerName } = req.body;
    if (!screenshot) return res.status(400).json({ error: "No screenshot provided" });
    
    const configuredName = playerName || 'LocalPlayer';
    
    // Alert tablets that an image is being processed
    io.emit("analysis-start", { screenshot, playerName: configuredName, id: Date.now() });
    res.json({ status: "Inference sequence initiated" });

    // Perform analysis asynchronously
    try {
      const prompt = `This is a Counter-Strike 2 kill feed screenshot. 
Analyze the feed and identify ALL victims killed by "${configuredName}".
Only include victims where "${configuredName}" is the killer.
Include a confidence score for each detection.
If no kills are visible for "${configuredName}", return an empty list.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: screenshot } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: KILL_FEED_SCHEMA
        }
      });

      const result = JSON.parse(response.text || '{"kills": []}');
      
      // Strict confidence cut-off to discard noise (0.7 threshold per prompt req)
      const validKills = (result.kills || []).filter((k: any) => k.confidence >= 0.7);
      
      if (validKills.length > 0) {
        registerKills(validKills);
      }
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
    } finally {
      io.emit("analysis-complete");
    }
  });

  // API: Python Agent reports a kill directly (e.g. via local OCR fallback)
  app.post("/api/report-kill", (req, res) => {
    const { kills } = req.body; 
    if (!kills || !Array.isArray(kills)) return res.status(400).json({ error: "Invalid kills data" });
    const added = registerKills(kills);
    res.json({ status: "ok", added });
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
