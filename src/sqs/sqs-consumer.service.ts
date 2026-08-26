import { SQSClient } from '@aws-sdk/client-sqs'
import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common'

import { Consumer } from './consumer.js'
import { HandlerRegistry } from './handler-registry.js'
import { buildQueueUrl } from './queue-url.js'
import { type QueueConfig, SQS_MODULE_OPTIONS, type SqsModuleOptions } from './types.js'

@Injectable()
export class SqsConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name)
  private readonly consumers: Consumer[] = []

  constructor(
    @Inject(SQS_MODULE_OPTIONS) private readonly options: SqsModuleOptions,
    private readonly handlerRegistry: HandlerRegistry,
  ) {
    const sqsClient = this.buildClient(options)
    this.consumers = options.queues.map((queue) =>
      this.createConsumer(this.resolveQueueUrl(queue), sqsClient),
    )
  }

  onModuleDestroy() {
    this.logger.log('Stopping all {count} consumers', { count: this.consumers.length })
    this.consumers.forEach((c) => c.stop())
  }

  startConsumers() {
    this.logger.log('Starting all {count} consumers', { count: this.consumers.length })
    this.consumers.forEach((c) => c.start())
  }

  getConsumers(): readonly Consumer[] {
    return this.consumers
  }

  private createConsumer(queueUrl: string, sqsClient: SQSClient): Consumer {
    return new Consumer(queueUrl, sqsClient, this.handlerRegistry, this.options.consumerOptions)
  }

  private resolveQueueUrl(queue: QueueConfig): string {
    if (typeof queue === 'string') {
      return queue
    }
    if (queue.url !== undefined) {
      return queue.url
    }
    return buildQueueUrl(queue.name, { prefix: queue.prefix, suffix: queue.suffix })
  }

  private buildClient(options: SqsModuleOptions): SQSClient {
    if (options.sqsClient) {
      return options.sqsClient
    }
    return new SQSClient({
      endpoint: options.endpoint,
      region: options.region,
      credentials: options.credentials,
      useQueueUrlAsEndpoint: !!options.endpoint,
    })
  }
}
