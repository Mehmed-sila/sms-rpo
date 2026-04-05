const xml2js = require('xml2js');

// Regex patterns — turli xil telefon raqam formatlarini qamrab oladi
const PHONE_PATTERNS = [
  // +998 90 123 45 67  |  +7 999 123-45-67  |  +1 (555) 123-4567
  /\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{0,9}/g,
  // 998901234567  |  79991234567  (11-12 xona, separator yo'q)
  /\b[1-9]\d{9,14}\b/g,
  // 8 (999) 123-45-67  (Rossiya formati)
  /\b8[\s]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
];

// Raqamni normalize qilish: faqat + va raqamlarni qoldirish
function normalizePhone(raw) {
  const digits = raw.replace(/[\s\-().]/g, '');
  // 7 raqamdan kam bo'lsa — bu telefon raqam emas
  if (digits.replace('+', '').length < 7) return null;
  return digits;
}

// Matndan telefon raqamlarni ajratib olish
function extractFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();

  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0; // regex stateful — reset kerak
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      const normalized = normalizePhone(match);
      if (normalized) found.add(normalized);
    }
  }

  return [...found];
}

// JSON dan rekursiv matn olish
function flattenJson(obj, depth = 0) {
  if (depth > 10) return '';
  if (typeof obj === 'string') return obj + ' ';
  if (typeof obj === 'number') return String(obj) + ' ';
  if (Array.isArray(obj)) return obj.map((v) => flattenJson(v, depth + 1)).join(' ');
  if (obj && typeof obj === 'object') {
    return Object.values(obj)
      .map((v) => flattenJson(v, depth + 1))
      .join(' ');
  }
  return '';
}

// XML parse qilish
async function parseXml(xmlString) {
  try {
    const result = await xml2js.parseStringPromise(xmlString, { explicitArray: false });
    return flattenJson(result);
  } catch {
    return xmlString; // parse bo'lmasa — raw string sifatida qaytarish
  }
}

// Asosiy funksiya: body va content-type dan raqamlar ajratish
async function extractPhoneNumbers(rawBody, contentType = '') {
  let textToSearch = '';

  if (contentType.includes('xml') || rawBody.trim().startsWith('<')) {
    textToSearch = await parseXml(rawBody);
  } else {
    // JSON yoki boshqa format
    try {
      const parsed = JSON.parse(rawBody);
      textToSearch = flattenJson(parsed);
    } catch {
      textToSearch = rawBody;
    }
  }

  return extractFromText(textToSearch);
}

module.exports = { extractPhoneNumbers, extractFromText };
