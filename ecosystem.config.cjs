/**
 * PM2 config for production with Next.js `output: 'standalone'`.
 * Do not use `next start` — use the standalone Node server.
 *
 * Deploy: npm ci && npm run build && pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'time-tracker-frontend',
      cwd: __dirname,
      script: 'node',
      args: '.next/standalone/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
