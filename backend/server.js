require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const webhookRoutes = require('./src/routes/webhook');
const apiRoutes = require('./src/routes/api');
const errorHandler = require('./src/middleware/errorHandler');
const { initSocket } = require('./src/services/socketService');

const app = express();
const server = http.createServer(app);

// Socket.io — CORS bilan
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// io ni routes ichida ishlatish uchun
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));

// Webhook uchun raw body kerak (JSON va XML ikkalasi uchun)
app.use('/webhook', express.text({ type: '*/*', limit: '1mb' }));

// API uchun JSON
app.use('/api', express.json());

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io events
initSocket(io);

// Scheduled SMS runner — har minutda tekshiriladi
const supabase = require('./src/config/database');
const { broadcastToAndroid } = require('./src/services/socketService');
setInterval(async () => {
  try {
    const { data } = await supabase.from('scheduled_sms')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10);
    if (!data?.length) return;
    for (const task of data) {
      await supabase.from('scheduled_sms').update({ status: 'processing' }).eq('id', task.id);
      const { data: sms } = await supabase.from('sms_history')
        .insert({ phone_numbers: task.phone_numbers, message: task.message, status: 'pending' })
        .select('id').single();
      if (sms?.id && task.method === 'android') {
        broadcastToAndroid(io, 'sms:new', { id: sms.id, phone_numbers: task.phone_numbers, message: task.message });
      }
      await supabase.from('scheduled_sms').update({ status: 'sent' }).eq('id', task.id);
    }
  } catch {}
}, 60000);

// Error handler (eng oxirida bo'lishi kerak)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/<webhook-id>`);
});
