import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { MultiplayerServer } from "./server/multiplayer";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Initialize Multiplayer WebSocket Server
  const multiplayer = new MultiplayerServer();
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    multiplayer.handleConnection(ws);
  });

  // Middleware for parsing JSON requests
  app.use(express.json());

  // REST API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/api/tables", (req, res) => {
    res.json(multiplayer.getTableSummaries());
  });

  app.get("/api/multiplayer/table/:tableId", (req, res) => {
    const { tableId } = req.params;
    const data = multiplayer.getHttpTableState(tableId);
    if (!data) {
      return res.status(404).json({ error: "Masa bulunamadı" });
    }
    res.json(data);
  });

  app.post("/api/multiplayer/action", (req, res) => {
    try {
      const result = multiplayer.handleHttpAction(req.body);
      res.json(result);
    } catch (err: any) {
      console.error("[Multiplayer API] Error processing action:", err);
      res.status(500).json({ success: false, error: err?.message || "Sunucu hatası" });
    }
  });

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.on("error", (err: NodeJS.ErrnoException) => {
    console.error("[Casino Server] Server encountered an error:", err);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Casino Server] Running on http://0.0.0.0:${PORT} (WS on /ws)`);
  });
}

startServer();
