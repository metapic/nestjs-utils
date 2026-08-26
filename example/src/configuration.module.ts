import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

/**
 * Shared configuration for both the web and consumer processes. A single
 * validate() produces the full config shape (auth + sqs); each app reads only
 * the keys it needs.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'example/.env'],
      validate: (config: Record<string, string | undefined>) => ({
        auth: {
          jwkPath: config.JWK_PATH,
          jwtSecret: config.JWT_SECRET,
          jwtIssuer: config.JWT_ISSUER,
          jwtAudience: config.JWT_AUDIENCE,
        },
        sqs: {
          endpoint: config.SQS_ENDPOINT,
          queues: ['queue1-local'],
        },
      }),
    }),
  ],
})
export class ConfigurationModule {}
