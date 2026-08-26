import { runConsumers } from '@metapic/nestjs-utils/sqs'
import { type INestApplicationContext } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { ConsumerAppModule } from '@/consumer.module'

/**
 * Standalone worker process that runs only the SQS consumers, without the HTTP
 * server. It boots a lean application context (no HTTP adapter, no database) and
 * starts polling.
 */
async function bootstrapConsumers() {
  const app: INestApplicationContext = await NestFactory.createApplicationContext(ConsumerAppModule)

  // Flush logs on graceful shutdown (SIGINT/SIGTERM) and stop consumers via
  // onModuleDestroy.
  app.enableShutdownHooks()

  runConsumers(app)
}

bootstrapConsumers().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error during consumer bootstrap:', err)
})
