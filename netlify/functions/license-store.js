re('fs');
const path = require('path');
let getStore = null;

try {
  ({ getStore } = require('@netlify/blobs'));
} catch (e) {}

const STORE_PATH = path.resolve(__dirname, 'license-store-data.json');
const STORE_NAME = 'yskellai-licenses';
const STORE_KEY = 'records';

function getLicenseStore() {
  return getStore({
    name: STORE_NAME,
    siteID: process.env.yskellai.netlify.app,
    token: process.env.nfp_bqsiF2yhed8jeErbiGAqeJ4QkJwFtWSa4205
  });
}

async function readRecords() {
  if (getStore) {
    try {
      const records = await getLicenseStore().get(STORE_KEY, { type: 'json' });
      return Array.isArray(records) ? records : [];
    } catch (e) {}
  }

  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function writeRecords(records) {
  if (getStore) {
    try {
      await getLicenseStore().setJSON(STORE_KEY, records);
      return true;
    } catch (e) {}
  }

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

function isExpired(record) {
  if (!record || !record.expiresAt) return false;
  return new Date(record.expiresAt).getTime() <= Date.now();
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
      return { statusCode: 200, headers, body: JSON.stringify(await readRecords()) };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const action = String(payload.action || 'list').toLowerCase();
      const records = await readRecords();

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

        await writeRecords(records);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records }) };
      }

      if (action === 'replace') {
        const safe = Array.isArray(payload.records) ? payload.records.map(normalizeRecord).filter(Boolean) : [];
        await writeRecords(safe);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records: safe }) };
      }

      if (action === 'validate') {
        const key = String(payload.key || '').trim().toUpperCase();
        const record = records.find(function(r) {
          return String(r.key || '').toUpperCase() === key;
        });

        if (!record) {
          return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'license not found' }) };
        }

        if (isExpired(record)) {
          return { statusCode: 410, headers, body: JSON.stringify({ ok: false, error: 'license expired', record: record }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, record: record }) };
      }

      if (action === 'delete') {
        const key = String(payload.key || '').trim().toUpperCase();
        const next = records.filter(function(r) {
          return String(r.key || '').toUpperCase() !== key;
        });
        await writeRecords(next);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, records: next }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(records) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }
};
