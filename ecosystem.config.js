module.exports = {
  apps: [{
    name: 'liveboard-server',
    script: './server/src/bulletproof-server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    watch: process.env.NODE_ENV !== 'production',
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '.git',
      'client',
      '*.log'
    ],
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Monitoring
    instance_var: 'INSTANCE_ID',
    // Node.js flags
    node_args: '--max-old-space-size=2048',
    // Crash handling
    exp_backoff_restart_delay: 100,
  }]
};
