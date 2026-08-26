import { SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE } from '@metapic/nestjs-utils'
import { AuthModule } from '@metapic/nestjs-utils/auth'
import { SqsModule } from '@metapic/nestjs-utils/sqs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApiVersionGuard, AuthService, User, UserRepository } from '@/auth'
import { CatChangedHandler } from '@/cat-changed.handler'
import { CatsModule } from '@/cats.module'

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
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'db',
      port: 3306,
      username: 'metapic',
      password: 'metapic',
      database: 'example',
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    }),
    AuthModule.forRoot<User>({
      useJwt: true,
      userJwtResolver: AuthService,
      excludedPaths: ['/cat-stats/breeds'],
      extraProviders: [UserRepository],
      extraAuthGuards: [ApiVersionGuard],
    }),
    SqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const endpoint = config.get<string>('sqs.endpoint')
        const queues = config.get<string[]>('sqs.queues') ?? []
        return {
          // elasticmq exposes queues at {endpoint}/queue/{name}.
          queues: queues.map((name) => ({ url: `${endpoint}/queue/${name}` })),
          endpoint,
          region: 'us-east-1',
          credentials: endpoint ? { accessKeyId: 'local', secretAccessKey: 'local' } : undefined,
        }
      },
    }),
    CatsModule,
  ],
  providers: [SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE, CatChangedHandler],
})
export class AppModule {}
