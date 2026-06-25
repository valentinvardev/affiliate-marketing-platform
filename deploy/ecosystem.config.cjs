// pm2 config — process manager para correr el panel en el VPS.
// Uso:  pm2 start deploy/ecosystem.config.cjs   (desde la carpeta del proyecto)
//       pm2 save && pm2 startup
//
// Corremos `next start` DIRECTO (no vía `npm start`): así pm2 controla el proceso
// real de Next. Con el wrapper de npm, el `next start` hijo quedaba huérfano y
// seguía agarrado al puerto → EADDRINUSE en cada reinicio.
//
// next start lee el .env del proyecto solo, así que los secretos van en .env
// (no hace falta repetirlos acá).
module.exports = {
  apps: [
    {
      name: "tapsur",
      cwd: __dirname + "/..",                       // carpeta del proyecto
      script: "node_modules/next/dist/bin/next",    // binario de Next directo (sin npm)
      args: "start -p 4010",                        // puerto propio (3000=photoplatform, 3010=surcodia, etc.)
      exec_mode: "fork",                            // fork, NO cluster
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
