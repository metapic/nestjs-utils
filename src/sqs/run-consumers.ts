import { type INestApplicationContext } from '@nestjs/common'

import { SqsConsumerService } from './sqs-consumer.service.js'

/**
 * Resolve the SqsConsumerService from a Nest application context and start all
 * configured consumers. Call once in your bootstrap after `NestFactory.create`.
 */
export function runConsumers(app: INestApplicationContext): void {
  app.get(SqsConsumerService).startConsumers()
}
