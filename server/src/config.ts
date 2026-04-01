/**
 * Centralized Configuration Management
 * All environment variables and hardcoded constants go here
 * Validates on startup and provides typed access
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'JINA_API_KEY',
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'REDIS_URL',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_AI_KEY',
  'XAI_API_KEY',
  'CEREBRAS_API_KEY',
];

export interface Config {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // Database
  DATABASE_URL: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  GOOGLE_CLIENT_ID: string;

  // External APIs
  JINA_API_KEY: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GOOGLE_AI_KEY?: string;
  XAI_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  REDIS_URL?: string;
  TAVILY_API_KEY?: string;

  // CORS
  CORS_ORIGIN: string;

  // RAG Configuration
  RAG: {
    CHUNK_SIZE: number;
    CHUNK_OVERLAP: number;
    SIMILARITY_THRESHOLD: number;
    TOP_K_RESULTS: number;
    MAX_CONTEXT_MESSAGES: number;
  };

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: number;
    MAX_REQUESTS: number;
    CHAT_MAX_REQUESTS: number;
    AUTH_MAX_REQUESTS: number;
  };

  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE_MB: number;
    ALLOWED_TYPES: string[];
  };

  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  LOG_FILE: string;
}

function validateConfig(): void {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    );
  }
}

function getConfig(): Config {
  validateConfig();

  return {
    PORT: parseInt(process.env.PORT || '8000', 10),
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',

    DATABASE_URL: process.env.DATABASE_URL!,

    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRY: '7d',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,

    JINA_API_KEY: process.env.JINA_API_KEY!,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GOOGLE_AI_KEY: process.env.GOOGLE_AI_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,

    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    RAG: {
      CHUNK_SIZE: 1000,
      CHUNK_OVERLAP: 200,
      SIMILARITY_THRESHOLD: 0.70, // Confidence threshold for answers
      TOP_K_RESULTS: 5,
      MAX_CONTEXT_MESSAGES: 10, // Last N messages for context
    },

    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
      CHAT_MAX_REQUESTS: 20,
      AUTH_MAX_REQUESTS: 5,
    },

    FILE_UPLOAD: {
      MAX_SIZE_MB: 10,
      ALLOWED_TYPES: [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
      ],
    },

    LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
    LOG_FILE: 'logs/app.log',
  };
}

export const config = getConfig();
