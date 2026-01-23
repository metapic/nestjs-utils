import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  const config = new DocumentBuilder()
    .setTitle('@metapic/nestjs-utils example')
    .setDescription('An example Nest.js application for the @metapic/nestjs-utils package.')
    .setVersion('1.0')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, documentFactory)

  await app.listen(process.env.PORT ?? 3000, '::')
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error during bootstrap:', err)
})
