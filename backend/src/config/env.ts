import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default(3001),
  
  // Database Configuration
  DATABASE_URL: z.string().url(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // CORS Configuration
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_RESPONSE_BODY: z.string().default('false').transform((v: string) => v === 'true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(100),
  
  // Security
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default(12),
  
  // Optional Redis for caching (future enhancement)
  REDIS_URL: z.string().url().optional(),
  
  // Optional Email service (future enhancement)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Optional File Upload service (future enhancement)
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

let config: EnvConfig

export function validateAndLoadConfig(): EnvConfig {
  try {
    config = envSchema.parse(process.env)
    
    // Log configuration in development (but hide sensitive data)
    if (config.NODE_ENV === 'development') {
      const safeConfig = {
        ...config,
        DATABASE_URL: config.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
        JWT_SECRET: '***',
        SMTP_PASSWORD: config.SMTP_PASSWORD ? '***' : undefined,
        AWS_SECRET_ACCESS_KEY: config.AWS_SECRET_ACCESS_KEY ? '***' : undefined,
      }
      console.log('✅ Environment configuration loaded:', JSON.stringify(safeConfig, null, 2))
    }
    
    return config
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:')
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

export function getConfig(): EnvConfig {
  if (!config) {
    throw new Error('Configuration not loaded. Call validateAndLoadConfig() first.')
  }
  return config
}

// Helper functions for common configurations
export const isDevelopment = () => getConfig().NODE_ENV === 'development'
export const isProduction = () => getConfig().NODE_ENV === 'production'
export const isTest = () => getConfig().NODE_ENV === 'test'
