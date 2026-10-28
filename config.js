// Solo expone valores públicos (URL y clave anon).
module.exports = (req, res) => res.status(200).json({ url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY });
