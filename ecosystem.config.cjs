// Konfigurasi PM2 — menjaga aplikasi tetap hidup di VPS.
// Jalankan: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "dekorlamaran",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      time: true,
    },
  ],
};
