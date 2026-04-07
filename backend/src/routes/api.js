const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const supabase = require('../config/database');
const eskiz = require('../services/eskizService');
const { extractPhoneNumbers } = require('../services/phoneExtractor');
const { broadcastToAndroid } = require('../services/socketService');

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

// Device cache
const deviceCache = new Map();

// GET /api/sms/pending
router.get('/sms/pending', async (req, res) => {
  supabase.from('sms_history')
    .update({ status: 'pending', device_id: null })
    .eq('status', 'processing')
    .lt('created_at', new Date(Date.now() - 60000).toISOString())
    .then(() => {}).catch(() => {});

  const { token } = req.query;
  if (!token) return res.json([]);
  try {
    let deviceId = deviceCache.get(token);
    if (!deviceId) {
      const { data: dev } = await supabase.from('devices').select('id').eq('token', token).single();
      if (!dev) return res.json([]);
      deviceId = dev.id;
      deviceCache.set(token, deviceId);
    }

    supabase.from('devices')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('token', token)
      .then(() => {}).catch(() => {});

    const { data: pending } = await supabase
      .from('sms_history')
      .select('id, phone_numbers, message')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (!pending || pending.length === 0) return res.json([]);

    const ids = pending.map((s) => s.id);
    await supabase.from('sms_history')
      .update({ status: 'processing', device_id: deviceId })
      .in('id', ids);

    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/result
router.post('/sms/result', async (req, res) => {
  const { token, smsId, status, errorMessage } = req.body;
  if (!token || !smsId || !status) return res.status(400).json({ error: 'token, smsId, status required' });
  try {
    const { error } = await supabase.from('sms_history')
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

// POST /api/sms/batch-result
router.post('/sms/batch-result', async (req, res) => {
  const { results } = req.body;
  if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ error: 'results array required' });
  try {
    const now = new Date().toISOString();
    await Promise.all(
      results.map(({ smsId, status }) =>
        supabase.from('sms_history').update({ status, sent_at: now }).eq('id', smsId)
      )
    );
    const io = req.app.get('io');
    results.forEach(({ smsId, status }) => io.emit('sms:updated', { smsId, status }));
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
      const { pushToAndroid, getOnlineTokens } = require('../services/socketService');
      const onlineTokens = getOnlineTokens();

      if (onlineTokens.length <= 1) {
        // Bitta yoki nol qurilma — oddiy broadcast
        broadcastToAndroid(io, 'sms:new', { id: smsId, phone_numbers: phoneNumbers, message });
      } else {
        // Ko'p qurilma — yukni teng taqsimlash
        const chunk = Math.ceil(phoneNumbers.length / onlineTokens.length);
        const batches = [];
        for (let i = 0; i < onlineTokens.length; i++) {
          const batch = phoneNumbers.slice(i * chunk, (i + 1) * chunk);
          if (batch.length === 0) break;
          batches.push({ token: onlineTokens[i], phones: batch });
        }
        await Promise.all(batches.map(async ({ token, phones }) => {
          const { data: batchSms } = await supabase.from('sms_history')
            .insert({ phone_numbers: phones, message, status: 'pending', webhook_log_id: webhookLogId || null })
            .select('id').single();
          if (batchSms?.id) pushToAndroid(io, token, 'sms:new', { id: batchSms.id, phone_numbers: phones, message });
        }));
        // Asl yozuvni o'chirish (bo'lingan)
        await supabase.from('sms_history').delete().eq('id', smsId);
      }

      return res.json({ smsId, status: 'pending', method: 'android', devices: onlineTokens.length });
    }

    if (method === 'eskiz') {
      const results = await Promise.allSettled(phoneNumbers.map((phone) => eskiz.sendSms(phone, message)));
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

// GET /api/sms/history — filter + pagination
router.get('/sms/history', async (req, res) => {
  try {
    const { search, from, to, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('sms_history')
      .select('*, devices(device_name, platform)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to)   query = query.lte('created_at', new Date(to + 'T23:59:59').toISOString());

    const { data, error, count } = await query;
    if (error) throw error;

    // phone number search (client-side filter since Supabase array contains)
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = data.filter(s =>
        s.message?.toLowerCase().includes(q) ||
        s.phone_numbers?.some(p => p.includes(q))
      );
    }

    res.json({ data: result, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sms/export — CSV
router.get('/sms/export', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = supabase
      .from('sms_history')
      .select('id, message, phone_numbers, status, created_at, sent_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to)   query = query.lte('created_at', new Date(to + 'T23:59:59').toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const rows = [['ID', 'Xabar', 'Raqamlar', 'Status', 'Yuborilgan vaqt']];
    data.forEach(s => {
      rows.push([
        s.id,
        `"${(s.message || '').replace(/"/g, '""')}"`,
        `"${(s.phone_numbers || []).join(', ')}"`,
        s.status || '',
        s.sent_at ? new Date(s.sent_at).toLocaleString('uz') : '',
      ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sms-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalRes, todayRes, devRes, last7Res] = await Promise.all([
      supabase.from('sms_history').select('id, status', { count: 'exact', head: false }),
      supabase.from('sms_history')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('devices').select('id, status', { count: 'exact', head: false }),
      supabase.from('sms_history')
        .select('created_at, phone_numbers')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: true }),
    ]);

    const all = totalRes.data || [];
    const totalSms = all.length;
    const sentCount = all.filter(s => s.status === 'sent').length;
    const failedCount = all.filter(s => s.status === 'failed').length;
    const pendingCount = all.filter(s => s.status === 'pending' || s.status === 'processing').length;
    const todayCount = todayRes.count || 0;
    const onlineDevices = (devRes.data || []).filter(d => d.status === 'online').length;
    const totalDevices = (devRes.data || []).length;

    // Last 7 days chart data
    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      chartMap[key] = { date: key, count: 0, phones: 0 };
    }
    (last7Res.data || []).forEach(s => {
      const key = s.created_at.slice(0, 10);
      if (chartMap[key]) {
        chartMap[key].count++;
        chartMap[key].phones += (s.phone_numbers || []).length;
      }
    });

    res.json({
      totalSms,
      sentCount,
      failedCount,
      pendingCount,
      todayCount,
      onlineDevices,
      totalDevices,
      chart: Object.values(chartMap),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SHABLONLAR ────────────────────────────────────────────────
// GET /api/templates
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates
router.post('/templates', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'name, message required' });
  try {
    const { data, error } = await supabase.from('templates').insert({ name, message }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/templates/:id
router.delete('/templates/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('templates').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── KONTAKT GURUHLARI ─────────────────────────────────────────
// GET /api/groups
router.get('/groups', async (req, res) => {
  try {
    const { data, error } = await supabase.from('contact_groups').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups
router.post('/groups', async (req, res) => {
  const { name, phones } = req.body;
  if (!name || !phones?.length) return res.status(400).json({ error: 'name, phones required' });
  try {
    const { data, error } = await supabase.from('contact_groups').insert({ name, phones }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groups/:id
router.delete('/groups/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('contact_groups').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── JADVAL SMS ────────────────────────────────────────────────
// POST /api/sms/schedule
router.post('/sms/schedule', async (req, res) => {
  const { phoneNumbers, message, method, scheduledAt } = req.body;
  if (!phoneNumbers?.length || !message || !scheduledAt) {
    return res.status(400).json({ error: 'phoneNumbers, message, scheduledAt required' });
  }
  try {
    const { data, error } = await supabase.from('scheduled_sms')
      .insert({ phone_numbers: phoneNumbers, message, method: method || 'android', scheduled_at: scheduledAt })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sms/scheduled
router.get('/sms/scheduled', async (req, res) => {
  try {
    const { data, error } = await supabase.from('scheduled_sms')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sms/scheduled/:id
router.delete('/sms/scheduled/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('scheduled_sms').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QURILMALAR ────────────────────────────────────────────────
router.get('/devices', async (req, res) => {
  try {
    await supabase.from('devices').update({ status: 'offline' })
      .eq('status', 'online')
      .lt('last_seen', new Date(Date.now() - 15000).toISOString());

    const { data, error } = await supabase.from('devices')
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
    const { data, error } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs
router.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('webhook_logs')
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
