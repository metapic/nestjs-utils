import { SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE } from '@metapic/nestjs-utils'
import { AuthModule } from '@metapic/nestjs-utils/auth'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApiVersionGuard, AuthService, User, UserRepository } from '@/auth'
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
    CatsModule,
  ],
  providers: [SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE],
})
export class AppModule {}
