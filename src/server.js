const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const { initMultiplayerSocket } = require("./socket/multiplayerSocket");

const app = express();
const FRONTEND_URL = "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "multiplayer-service",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: "multiplayer-service",
    status: "ok"
  });
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

initMultiplayerSocket(io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`multiplayer-service activo en http://localhost:${PORT}`);
  console.log(`Origen permitido por CORS: ${FRONTEND_URL}`);
});