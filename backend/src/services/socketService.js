const androidSockets = new Map(); // token → socket.id

function initSocket(io) {
  io.on('connection', (socket) => {
    // Android qurilma ulanishi
    socket.on('android:join', (token) => {
      socket.data.token = token;
      socket.data.isAndroid = true;
      socket.join('android');
      androidSockets.set(token, socket.id);
      console.log(`[Android] Ulandi: ${socket.id} token=${token?.slice(0, 8)}...`);
    });

    socket.on('disconnect', () => {
      if (socket.data?.token) {
        androidSockets.delete(socket.data.token);
        console.log(`[Android] Uzildi: ${socket.id}`);
      }
    });
  });
}

// Berilgan token ga ega Android ga push yuborish
function pushToAndroid(io, token, event, data) {
  const sid = androidSockets.get(token);
  if (sid) io.to(sid).emit(event, data);
}

// Barcha Android qurilmalarga broadcast
function broadcastToAndroid(io, event, data) {
  io.to('android').emit(event, data);
}

function getAndroidCount() {
  return androidSockets.size;
}

function getOnlineTokens() {
  return [...androidSockets.keys()];
}

module.exports = { initSocket, pushToAndroid, broadcastToAndroid, getAndroidCount, getOnlineTokens };
