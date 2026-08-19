module.exports = {
  apps: [
    {
      name: 'h1ms-production',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000', 
      instances: 'max', 
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G', 
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'h1ms-pdf-worker',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/server/workers/pdfExportSync.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
};
