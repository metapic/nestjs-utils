import { SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE } from '@metapic/nestjs-utils'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CatsModule } from './cats.module'

@Module({
  imports: [
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
    CatsModule,
  ],
  providers: [SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE],
})
export class AppModule {}
