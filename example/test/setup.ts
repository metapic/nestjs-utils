import { setupSwagger } from '@metapic/nestjs-utils'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test, type TestingModule } from '@nestjs/testing'
import { afterAll, beforeAll } from 'vitest'

import { AppModule } from '@/app.module'

export let module: TestingModule
export let app: NestFastifyApplication

beforeAll(async () => {
  module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  setupSwagger(app)

  await app.init()
  await app.getHttpAdapter().getInstance().ready()
})

afterAll(async () => {
  if (app) {
    await app.close()
  }
})
