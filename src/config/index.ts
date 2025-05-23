const config = {
  server: {
    port: process.env.PORT,
    env: process.env.NODE_ENV
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  logging: {
    level: process.env.LOG_LEVEL || "info"
  },
  services: {
    frontend: {
      url: process.env.FRONTEND_URL || "http://localhost:3000"
    },
    auth: {
      url: process.env.AUTH_SERVICE_URL || "http://localhost:3002"
    },
    database: {
      url: process.env.DATABASE_SERVICE_URL || "http://localhost:3001"
    },
    email: {
      url: process.env.MAIL_SERVICE_URL || "http://localhost:3003"
    }
  },
  notifications: {
    discord: {
      webhook: process.env.DISCORD_INFO_WEBHOOK || ""
    },
    monitoring: {
      intervalMinutes: parseInt(
        process.env.MONITORING_INTERVAL_MINUTES || "5",
        10
      ),
      enabled: process.env.ENABLE_MONITORING === "true"
    },
    service_name: process.env.SERVICE_NAME || ""
  }
};

export default config;
