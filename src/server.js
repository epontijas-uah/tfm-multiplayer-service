const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { initGameSocket } = require('./socket/gameSocket');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

initGameSocket(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`game-service running on port ${PORT}`));