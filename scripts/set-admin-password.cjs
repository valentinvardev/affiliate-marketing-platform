// Rota la contraseña de un usuario (pensado para el admin).
// Uso:  node scripts/set-admin-password.cjs <username> <nuevaPassword>
// Lee DATABASE_URL del .env del proyecto. La password NO se guarda en ningún lado.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const ROOT = path.join(__dirname, "..");

// cargar .env
try {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
} catch { /* el .env quizá ya está en el entorno */ }

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("uso: node scripts/set-admin-password.cjs <username> <nuevaPassword>");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Usá una contraseña de al menos 10 caracteres.");
  process.exit(1);
}

const { PrismaClient } = require(path.join(ROOT, "generated/prisma"));
const db = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash(password, 12);
  const u = await db.user.update({ where: { username }, data: { password: hash } });
  console.log("✓ Contraseña actualizada para:", u.username, "(role:", u.role + ")");
})()
  .then(() => db.$disconnect())
  .catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
