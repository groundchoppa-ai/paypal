const fs = require('fs');
const path = require('path');

const STORE_PATH = path.resolve(__dirname, 'license-store-data.json');

function readRecords() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeRecords(records) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

function normalizeRecord(record) {
  if (!record || !record.key) return null;
  return {
    key: String(record.key).trim().toUpperCase(),
    label: String(record.label || 'Unassigned'),
    plan: String(record.plan || 'lifetime'),
    created: record.created || new Date().toLocaleDateString(),
    expiresAt: record.expiresAt || null
  };
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeRecord).filter(Boolean);
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify(readRecords()) };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const action = String(payload.action || 'list').toLowerCase();
      const records = readRecords();

      if (action === 'save') {
        const record = normalizeRecord(payload.record);
        if (!record) {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'missing record key' }) };
        }

        const existingIndex = records.findIndex(function(r) {
          return String(r.key || '').toUpperCase() === record.key;
        });

        if (existingIndex >= 0) records[existingIndex] = record;
        else records.unshift(record);

        writeRecords(records);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records }) };
      }

      if (action === 'replace') {
        const next = normalizeRecords(payload.records || []);
        writeRecords(next);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records: next }) };
      }

      if (action === 'delete') {
        const key = String(payload.key || '').trim().toUpperCase();
        const next = records.filter(function(r) {
          return String(r.key || '').toUpperCase() !== key;
        });
        writeRecords(next);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records: next }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(records) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }
};
