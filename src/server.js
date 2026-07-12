const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const { Server } = require("socket.io");
const { initMultiplayerSocket } = require("./socket/gameSocket");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "multiplayer-service",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "multiplayer-service"
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

initMultiplayerSocket(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`multiplayer-service running on http://localhost:${PORT}`);
});