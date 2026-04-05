const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { extractPhoneNumbers } = require('../services/phoneExtractor');

// POST /webhook/:id  — boshqa saytlar shu URL ga yuboradi
router.post('/:id', async (req, res) => {
  const { id: webhookId } = req.params;
  const contentType = req.headers['content-type'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Webhook mavjudligini tekshirish
  const webhook = await pool.query('SELECT id FROM webhooks WHERE id = $1', [webhookId]);
  if (webhook.rowCount === 0) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  // Raw body olish (string sifatida)
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // Telefon raqamlarni ajratib olish
  const phones = await extractPhoneNumbers(rawBody, contentType);

  // DB ga saqlash
  const log = await pool.query(
    `INSERT INTO webhook_logs (webhook_id, raw_body, content_type, extracted_phones, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, extracted_phones, created_at`,
    [webhookId, rawBody, contentType, phones, ip]
  );

  const logEntry = log.rows[0];

  // Dashboard ga real-time xabar yuborish (io global orqali)
  const io = req.app.get('io');
  io.emit('webhook:received', {
    id: logEntry.id,
    webhookId,
    phones: logEntry.extracted_phones,
    createdAt: logEntry.created_at,
  });

  res.status(200).json({ received: true, phonesFound: phones.length });
});

module.exports = router;
