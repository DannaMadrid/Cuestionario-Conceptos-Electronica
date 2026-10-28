// Función serverless (Vercel). Recalcula la nota en el servidor y guarda con service_role.
const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY, A = process.env.SUPABASE_ANON_KEY;
const E = (x, y) => String(x) === String(y);
const r2 = n => Math.round(n * 100) / 100;

function grade(a, h) {
  const s = [];
  s[0] = [1,0,1,0,1].filter((c, j) => E(a[0]?.["v" + j], c)).length / 5;
  s[1] = [2,3,1,4,0].filter((c, j) => E(a[1]?.["m" + j], c)).length / 5;
  [2,0,1,3].forEach((c, k) => { s[2 + k] = E(a[2 + k]?.o, c) ? 1 : 0; });
  s[6] = [0,5,1,6,2,7,8].filter((c, j) => E(a[6]?.["s" + j], c)).length / 7;
  s[7] = ([0,1,2,3].filter(j => E(a[7]?.["n" + j], j)).length + [1,2,3].filter(j => E(a[7]?.["k" + j], j - 1)).length) / 7;
  let st = 0;
  for (const ans of [1,9,8,4]) {
    if (parseFloat(String(a[8]?.["r" + st] ?? "").replace(",", ".")) === ans) st++; else break;
  }
  const cod = String(a[8]?.cod ?? "").trim() === "1984";
  const pw = String(a[8]?.pw ?? "").trim().toLowerCase() === "transistor";
  s[8] = Math.min(1, Math.max(0, (st + cod + pw - 0.03 * h) / 6));
  const n = x => parseFloat(String(x ?? "").replace(",", "."));
  const q = a[9] || {};
  s[9] = [E(q.who, 2), Math.abs(n(q.i1) - 3) < 0.01 && Math.abs(n(q.i2) - 1) < 0.01,
    String(q.msg ?? "").trim().length >= 20, q.conf !== undefined && q.conf !== ""].filter(Boolean).length / 4;
  const total = r2(s.reduce((x, y) => x + y, 0));
  return { total, pct: r2(total * 10), ok: s.filter(x => x >= 0.999).length };
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  try {
    const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
    const ur = await fetch(U + "/auth/v1/user", { headers: { apikey: A, Authorization: "Bearer " + tok } });
    if (!ur.ok) return res.status(401).json({ error: "Sesión inválida" });
    const user = await ur.json();
    const b = req.body || {};
    const nombre = String(b.nombre || "").trim().slice(0, 80);
    if (!nombre || !/^[0-9a-f-]{36}$/i.test(b.id || "")) return res.status(400).json({ error: "Datos incompletos" });
    if (!Array.isArray(b.respuestas) || b.respuestas.length !== 10) return res.status(400).json({ error: "Respuestas inválidas" });
    const g = grade(b.respuestas, Math.min(4, Math.max(0, +b.pistas || 0)));
    const H = { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json" };
    const prev = await (await fetch(`${U}/rest/v1/resultados?user_id=eq.${user.id}&select=id`, { headers: H })).json();
    if (prev.length >= 30 && !prev.some(r => r.id === b.id)) return res.status(429).json({ error: "Límite de intentos alcanzado" });
    const row = { id: b.id, user_id: user.id, nombre, puntaje: g.total, puntaje_max: 10, porcentaje: g.pct,
      correctas: g.ok, incorrectas: 10 - g.ok, respuestas: b.respuestas };
    const ins = await fetch(U + "/rest/v1/resultados", { method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(row) });
    if (!ins.ok) return res.status(500).json({ error: "La base de datos rechazó el guardado" });
    let saved = (await ins.json())[0];
    if (!saved) { // doble envío: devolver el intento ya guardado si es del mismo usuario
      saved = (await (await fetch(`${U}/rest/v1/resultados?id=eq.${b.id}&user_id=eq.${user.id}&select=puntaje,porcentaje,correctas`, { headers: H })).json())[0];
      if (!saved) return res.status(409).json({ error: "Identificador de intento en conflicto" });
    }
    return res.status(200).json({ puntaje: saved.puntaje, porcentaje: saved.porcentaje, correctas: saved.correctas });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor" });
  }
}
module.exports = handler;
module.exports.grade = grade;
