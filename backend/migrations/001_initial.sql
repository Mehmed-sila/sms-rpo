-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Webhook endpoints (har bir foydalanuvchi uchun)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'My Webhook',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kiruvchi webhook ma'lumotlari
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  raw_body TEXT,
  content_type VARCHAR(100),
  extracted_phones TEXT[],         -- ajratilgan telefon raqamlar
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ulangan qurilmalar (Android/iOS)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socket_id VARCHAR(255) UNIQUE,   -- joriy Socket.io session ID
  platform VARCHAR(10) NOT NULL,   -- 'android' | 'ios'
  device_name VARCHAR(255),
  status VARCHAR(10) DEFAULT 'offline',  -- 'online' | 'offline'
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS yuborish tarixi
CREATE TABLE IF NOT EXISTS sms_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  webhook_log_id UUID REFERENCES webhook_logs(id),
  phone_numbers TEXT[],
  message TEXT NOT NULL,
  status VARCHAR(10) DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed'
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indekslar (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_history_created_at ON sms_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
