const connectedDevices = new Map();

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      connectedDevices.delete(socket.id);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSocket };
