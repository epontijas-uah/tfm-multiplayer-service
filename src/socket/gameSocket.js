const jwt = require("jsonwebtoken");

const rooms = {};

function getUsernameFromToken(decodedToken) {
  return (
    decodedToken.username ||
    decodedToken.user?.username ||
    decodedToken.name ||
    decodedToken.id ||
    "unknown-player"
  );
}

function removePlayerFromRooms(socket, io) {
  Object.keys(rooms).forEach((roomId) => {
    const previousLength = rooms[roomId].length;

    rooms[roomId] = rooms[roomId].filter(
      (player) => player.socketId !== socket.id
    );

    if (rooms[roomId].length !== previousLength) {
      io.to(roomId).emit("room_update", rooms[roomId]);
    }

    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
    }
  });
}

function initMultiplayerSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Token no proporcionado"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id || decoded.userId || decoded.sub || null,
        username: getUsernameFromToken(decoded)
      };

      return next();
    } catch (error) {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Jugador conectado: ${socket.user.username}`);

    socket.emit("connected_to_multiplayer", {
      message: "Conectado correctamente al multiplayer-service",
      player: socket.user
    });

    socket.on("join_room", (roomId) => {
      if (!roomId) return;

      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }

      const alreadyInRoom = rooms[roomId].some(
        (player) => player.socketId === socket.id
      );

      if (!alreadyInRoom) {
        rooms[roomId].push({
          socketId: socket.id,
          id: socket.user.id,
          username: socket.user.username
        });
      }

      console.log(`${socket.user.username} se unió a sala: ${roomId}`);

      io.to(roomId).emit("room_update", rooms[roomId]);
    });

    socket.on("leave_room", (roomId) => {
      if (!roomId) return;

      socket.leave(roomId);

      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(
          (player) => player.socketId !== socket.id
        );

        io.to(roomId).emit("room_update", rooms[roomId]);

        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }

      console.log(`${socket.user.username} salió de sala: ${roomId}`);
    });

    socket.on("test_message", ({ roomId, message }) => {
      if (!roomId) return;

      socket.to(roomId).emit("test_message", {
        from: socket.user.username,
        message
      });
    });

    socket.on("player_move", ({ roomId, position }) => {
      if (!roomId || !position) return;

      socket.to(roomId).emit("player_moved", {
        player: {
          id: socket.user.id,
          username: socket.user.username
        },
        position
      });
    });

    socket.on("disconnect", () => {
      console.log(`Jugador desconectado: ${socket.user.username}`);
      removePlayerFromRooms(socket, io);
    });
  });
}

module.exports = {
  initMultiplayerSocket
};