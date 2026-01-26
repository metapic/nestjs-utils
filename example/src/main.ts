import { setupSwagger } from '@metapic/nestjs-utils'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { type DocumentBuilder } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  setupSwagger(app, (builder: DocumentBuilder) =>
    builder
      .setTitle('@metapic/nestjs-utils example')
      .setDescription('An example Nest.js application for the @metapic/nestjs-utils package.'),
  )

  await app.listen(process.env.PORT ?? 3000, '::')
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error during bootstrap:', err)
})
