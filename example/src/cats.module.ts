import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CatStatsController } from '@/cat-stats.controller'
import { Cat } from '@/cat.entity'
import { CatsController } from '@/cats.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Cat])],
  controllers: [CatsController, CatStatsController],
})
export class CatsModule {}
