module.exports = {
  apps: [{
    name: 'badminton-backend',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart settings
    min_uptime: '10s',
    max_restarts: 10,
    // Auto restart on crash
    restart_delay: 1000,
    // Kill timeout
    kill_timeout: 3000,
    // Listen timeout
    listen_timeout: 5000
  }]
};
