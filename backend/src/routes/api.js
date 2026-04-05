const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const supabase = require('../config/database');
const eskiz = require('../services/eskizService');
const { extractPhoneNumbers } = require('../services/phoneExtractor');

// URL dan matn yuklash (proxy)
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// POST /api/extract
router.post('/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const content = await fetchUrl(url);
    const phones = await extractPhoneNumbers(content, 'text/plain');
    res.json({ phones, total: phones.length });
  } catch (err) {
    res.status(500).json({ error: 'URL yuklashda xatolik: ' + err.message });
  }
});

// POST /api/android/register
router.post('/android/register', async (req, res) => {
  try {
    const { deviceName } = req.body;
    const { data, error } = await supabase
      .from('devices')
      .insert({ platform: 'android', device_name: deviceName || 'Android', status: 'online', last_seen: new Date().toISOString() })
      .select('id, token')
      .single();
    if (error) throw error;
    res.json({ deviceId: data.id, token: data.token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sms/pending
router.get('/sms/pending', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.json([]);
  try {
    // Device ni online qilish
    const { data: dev, error: devErr } = await supabase
      .from('devices')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('token', token)
      .select('id')
      .single();

    if (devErr || !dev) {
      console.error('[Pending] Device topilmadi:', devErr?.message);
      return res.json([]);
    }

    // Pending SMS larni olish
    const { data: pending, error: pendingErr } = await supabase
      .from('sms_history')
      .select('id, phone_numbers, message')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (pendingErr) throw pendingErr;
    if (!pending || pending.length === 0) return res.json([]);

    // Processing ga o'tkazish
    const ids = pending.map((s) => s.id);
    await supabase
      .from('sms_history')
      .update({ status: 'processing', device_id: dev.id })
      .in('id', ids);

    res.json(pending);
  } catch (err) {
    console.error('[Pending] Xato:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/result
router.post('/sms/result', async (req, res) => {
  const { token, smsId, status, errorMessage } = req.body;
  if (!token || !smsId || !status) {
    return res.status(400).json({ error: 'token, smsId, status required' });
  }
  try {
    const { error } = await supabase
      .from('sms_history')
      .update({ status, error_message: errorMessage || null, sent_at: new Date().toISOString() })
      .eq('id', smsId);
    if (error) throw error;
    const io = req.app.get('io');
    io.emit('sms:updated', { smsId, status, errorMessage });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/send
router.post('/sms/send', async (req, res) => {
  const { phoneNumbers, message, method, webhookLogId } = req.body;
  if (!phoneNumbers?.length || !message || !method) {
    return res.status(400).json({ error: 'phoneNumbers, message, method required' });
  }
  try {
    const { data: sms, error: smsErr } = await supabase
      .from('sms_history')
      .insert({ phone_numbers: phoneNumbers, message, status: 'pending', webhook_log_id: webhookLogId || null })
      .select('id')
      .single();
    if (smsErr) throw smsErr;
    const smsId = sms.id;
    const io = req.app.get('io');

    if (method === 'android') {
      return res.json({ smsId, status: 'pending', method: 'android' });
    }

    if (method === 'eskiz') {
      const results = await Promise.allSettled(
        phoneNumbers.map((phone) => eskiz.sendSms(phone, message))
      );
      const failed = results.filter((r) => r.status === 'rejected');
      const status = failed.length === 0 ? 'sent' : 'failed';
      const errorMessage = failed.map((r) => r.reason?.message).join(', ') || null;

      await supabase.from('sms_history')
        .update({ status, error_message: errorMessage, sent_at: new Date().toISOString() })
        .eq('id', smsId);

      io.emit('sms:updated', { smsId, status, errorMessage });
      return res.json({ smsId, status, method: 'eskiz' });
    }

    res.status(400).json({ error: 'method must be android or eskiz' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sms/history
router.get('/sms/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sms_history')
      .select('*, devices(device_name, platform)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/devices
router.get('/devices', async (req, res) => {
  try {
    // 15s ichida ping bo'lmasa offline
    await supabase
      .from('devices')
      .update({ status: 'offline' })
      .eq('status', 'online')
      .lt('last_seen', new Date(Date.now() - 15000).toISOString());

    const { data, error } = await supabase
      .from('devices')
      .select('id, platform, device_name, status, last_seen')
      .order('last_seen', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs
router.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*, webhooks(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
