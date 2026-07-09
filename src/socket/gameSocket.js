const jwt = require('jsonwebtoken');

const rooms = {}; // { roomId: [{ socketId, username }] }

function initGameSocket(io) {
  // Middleware: verificar JWT en handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Unirse a una sala
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      if (!rooms[roomId]) rooms[roomId] = [];
      rooms[roomId].push({ socketId: socket.id, username: socket.user.username });

      io.to(roomId).emit('room_update', rooms[roomId]);
      console.log(`${socket.user.username} joined room ${roomId}`);
    });

    // Enviar acción de juego
    socket.on('game_action', ({ roomId, action }) => {
      socket.to(roomId).emit('game_action', {
        from: socket.user.username,
        action
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
        io.to(roomId).emit('room_update', rooms[roomId]);
      }
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
}

module.exports = { initGameSocket };