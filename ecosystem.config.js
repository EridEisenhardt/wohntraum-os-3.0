// PM2-Konfiguration für Wohntraum Rheinhessen OS (Next.js)
// Start:   pm2 start ecosystem.config.js
// Neustart nach Update: pm2 restart wohntraum-os
module.exports = {
  apps: [
    {
      name: 'wohntraum-os',
      cwd: '/var/www/wohntraum-os',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    }
  ]
}
