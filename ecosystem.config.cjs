module.exports = {
  apps: [
    {
      name: "domakin-mailer",
      script: "./dist/app.js",
      interpreter: "node",
      env: {
        NODE_ENV: "prod",
        PORT: 8080,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "300M",
      error_file: "/usr/src/app/logs/error.log",
      out_file: "/usr/src/app/logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};