export default function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json({
        ok: true,
        databaseConfigured: Boolean(process.env.SUPABASE_URL && (process.env.sb_secret || process.env.SUPABASE_SERVICE_ROLE_KEY)),
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
}
