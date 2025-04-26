require('dotenv').config();

module.exports = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // Security
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  apiKey: {
    hash: process.env.API_KEY_HASH || 'your_api_key_hash_here'
  },
  blocked: {
    ips: (process.env.BLOCKED_IPS || '').split(',').filter(Boolean),
    userAgents: (process.env.BLOCKED_USER_AGENTS || '').split(',').filter(Boolean)
  },

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'mechbuild_editor2',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password_here'
  },

  // Elasticsearch
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'your_elasticsearch_password_here'
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'your_redis_password_here'
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(',').filter(Boolean)
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || '/var/log/mechbuild-editor2'
  },

  // Monitoring
  monitoring: {
    prometheus: {
      port: process.env.PROMETHEUS_PORT || 9090
    },
    grafana: {
      port: process.env.GRAFANA_PORT || 3000
    },
    kibana: {
      port: process.env.KIBANA_PORT || 5601
    }
  }
}; 