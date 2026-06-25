// pm2 config — process manager para correr el panel en el VPS.
// Uso:  pm2 start deploy/ecosystem.config.cjs   (desde la carpeta del proyecto)
//       pm2 save && pm2 startup
//
// next start lee el .env del proyecto solo, así que los secretos van en .env
// (no hace falta repetirlos acá).
module.exports = {
  apps: [
    {
      name: "tapsur",
      cwd: __dirname + "/..",          // carpeta del proyecto (aff-cms)
      script: "npm",
      args: "start",                   // = next start -p 3010
      exec_mode: "fork",               // fork (NO cluster): cluster no sirve con `npm start`
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3010",          // ← puerto propio de tapsur (no pisa el 3000 de otras apps)
      },
    },
  ],
};
