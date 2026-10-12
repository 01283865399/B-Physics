async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(204).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.sb_secret || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const body = request.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const message = String(body.message || '').trim();

    if (!url || !serviceKey) return response.status(500).json({ error: 'Database is not configured' });
    if (name.length < 2 || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 2 || message.length > 5000) {
        return response.status(400).json({ error: 'بيانات الرسالة غير صحيحة' });
    }

    try {
        const result = await fetch(`${url}/rest/v1/contact_messages`, {
            method: 'POST',
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            },
            body: JSON.stringify({ name, email, message })
        });
        if (!result.ok) return response.status(result.status).json({ error: 'تعذر حفظ الرسالة' });
        return response.status(201).json({ ok: true });
    } catch (error) {
        console.error('Contact handler error:', error);
        return response.status(500).json({ error: 'تعذر الاتصال بقاعدة البيانات' });
    }
}

export default handler;