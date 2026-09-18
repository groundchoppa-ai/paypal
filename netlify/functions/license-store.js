const fs = require("fs");
const path = require("path");
const { getStore } = require("@netlify/blobs");

const STORE_PATH = path.resolve(__dirname, "license-store-data.json");
const STORE_NAME = "yskellai-licenses";
const STORE_KEY = "records";

async function readRecords() {
  try {
    const records = await getStore(STORE_NAME).get(STORE_KEY, { type: "json" });
    return Array.isArray(records) ? records : [];
  } catch (error) {
    try {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    } catch {
      return [];
    }
  }
}

async function writeRecords(records) {
  await getStore(STORE_NAME).setJSON(STORE_KEY, records);
}

function expired(record) {
  return record.expiresAt &&
    new Date(record.expiresAt).getTime() <= Date.now();
}

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const records = await readRecords();

    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(records)
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ ok: false, error: "Method not allowed" })
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const action = String(payload.action || "").toLowerCase();

    if (action === "save") {
      const record = payload.record;

      if (!record || !record.key) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: "Missing key" })
        };
      }

      const normalized = {
        key: String(record.key).trim().toUpperCase(),
        label: String(record.label || "Unassigned"),
        plan: String(record.plan || "lifetime"),
        created: record.created || new Date().toISOString(),
        expiresAt: record.expiresAt || null
      };

      const next = records.filter(
        item => item.key !== normalized.key
      );

      next.unshift(normalized);
      await writeRecords(next);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, record: normalized })
      };
    }

    if (action === "validate") {
      const key = String(payload.key || "").trim().toUpperCase();
      const record = records.find(item => item.key === key);

      if (!record) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ ok: false, error: "License not found" })
        };
      }

      if (expired(record)) {
        return {
          statusCode: 410,
          headers,
          body: JSON.stringify({ ok: false, error: "License expired" })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, record })
      };
    }

    if (action === "delete") {
      const key = String(payload.key || "").trim().toUpperCase();
      const next = records.filter(item => item.key !== key);

      await writeRecords(next);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid action" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
