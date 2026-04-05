const https = require('https');

const ESKIZ_BASE = 'https://notify.eskiz.uz/api';
let cachedToken = null;
let tokenExpiry = 0;

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'notify.eskiz.uz',
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await request('POST', '/auth/login', {
    email: process.env.ESKIZ_EMAIL,
    password: process.env.ESKIZ_PASSWORD,
  });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Eskiz login failed: ${JSON.stringify(res.body)}`);
  }

  cachedToken = res.body.data.token;
  tokenExpiry = Date.now() + 28 * 24 * 60 * 60 * 1000; // 28 kun
  return cachedToken;
}

// phoneNumber: "998901234567" formatida (+ belgisisiz)
async function sendSms(phoneNumber, message) {
  const token = await getToken();

  // + belgisini olib tashlash
  const phone = phoneNumber.replace(/^\+/, '');

  const res = await request('POST', '/message/sms/send', {
    mobile_phone: phone,
    message,
    from: process.env.ESKIZ_FROM || '4546',
    callback_url: '',
  }, token);

  if (res.status !== 200) {
    // Token muddati o'tgan bo'lsa — yangilash
    if (res.status === 401) {
      cachedToken = null;
      return sendSms(phoneNumber, message); // retry
    }
    throw new Error(`Eskiz send failed: ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

module.exports = { sendSms };
