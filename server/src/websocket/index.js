const { Server } = require('socket.io');

let ioInstance;

function initIO(server, origins) {
  const corsOrigin = Array.isArray(origins) ? origins : origins === '*' ? '*' : String(origins).split(',').map(s => s.trim());
  const credentials = corsOrigin !== '*';
  ioInstance = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

module.exports = { initIO, getIO };
