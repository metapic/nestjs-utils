import { AuthModule } from '@metapic/nestjs-utils/auth'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthService, User } from '@/auth'
import { CatStatsController } from '@/cat-stats.controller'
import { Cat } from '@/cat.entity'
import { CatsController } from '@/cats.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([Cat]),
    ConfigModule.forFeature(() => ({ jwt: { secret: 'this-is-not-a-real-secret!' } })),
    AuthModule.forRoot<User>({
      useJwt: true,
      userJwtResolver: AuthService,
      excludedPaths: ['/cat-stats/breeds'],
    }),
  ],
  controllers: [CatsController, CatStatsController],
})
export class CatsModule {}
