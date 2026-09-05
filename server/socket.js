let io = null;

const init = (server, corsOrigin) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('join-season', (seasonNumber) => {
      socket.join(`season-${seasonNumber}`);
    });
    socket.on('leave-season', (seasonNumber) => {
      socket.leave(`season-${seasonNumber}`);
    });
  });

  return io;
};

// Broadcasts a draft change to everyone viewing that season's draft room
const emitDraftUpdate = (seasonNumber, payload) => {
  if (io) io.to(`season-${seasonNumber}`).emit('draft-updated', payload);
};

module.exports = { init, emitDraftUpdate };
