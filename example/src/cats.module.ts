import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Cat } from './cat.entity'
import { CatsController } from './cats.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Cat])],
  controllers: [CatsController],
})
export class CatsModule {}
