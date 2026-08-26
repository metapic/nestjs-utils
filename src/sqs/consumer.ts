import { type Message, type SQSClient } from '@aws-sdk/client-sqs'
import { Injectable, Logger } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { Consumer as SQSConsumer } from 'sqs-consumer'

import { type HandlerRegistry } from './handler-registry.js'
import { withMessageSpan } from './message-tracing.js'
import {
  type Envelope,
  type Event,
  type Headers,
  type MessageAttributes,
  SnsNotification,
  type SqsModuleOptions,
} from './types.js'

@Injectable()
export class Consumer {
  private readonly logger = new Logger(Consumer.name)
  private readonly consumer: SQSConsumer

  constructor(
    private readonly queueUrl: string,
    sqsClient: SQSClient,
    private readonly handlerRegistry: HandlerRegistry,
    consumerOptions?: SqsModuleOptions['consumerOptions'],
  ) {
    this.consumer = new SQSConsumer({
      queueUrl: this.queueUrl,
      sqs: sqsClient,
      messageAttributeNames: ['event_id', 'event_type', 'published_at', 'source'],
      handleMessage: this.handle.bind(this),
      ...consumerOptions,
    })

    this.consumer.on('started', () => {
      this.logger.log('Listening for messages on queue {queue_url}', { queue_url: this.queueUrl })
    })
    this.consumer.on('stopped', () => {
      this.logger.log('Stopped listening for messages on queue {queue_url}', {
        queue_url: this.queueUrl,
      })
    })
    this.consumer.on('error', (err) => {
      this.logger.error('Error in consumer for queue {queue_url}', {
        err,
        queue_url: this.queueUrl,
      })
    })
    this.consumer.on('processing_error', (err) => {
      this.logger.error('Message processing error on queue {queue_url}', {
        err,
        queue_url: this.queueUrl,
      })
    })
    this.consumer.on('timeout_error', (err) => {
      this.logger.error('Timeout error on queue {queue_url}', { err, queue_url: this.queueUrl })
    })
  }

  async handle(message: Message): Promise<Message | undefined> {
    this.logger.debug('Handling message {message_id} from queue {queue_url}', {
      message_id: message.MessageId,
      queue_url: this.queueUrl,
    })

    if (!message.Body) {
      return Promise.reject(new Error('Message body is missing'))
    }

    const notification = plainToInstance(SnsNotification, JSON.parse(message.Body))
    if (notification?.Type !== 'Notification') {
      return Promise.reject(new Error('Message body is not a valid SNS notification'))
    }

    const headers = this.parseHeaders(notification.MessageAttributes)
    const handler = this.handlerRegistry.getHandler(headers.eventType)

    if (handler === null) {
      this.logger.error('No handler found for event type {event_type}', {
        event_type: headers.eventType,
      })
      return Promise.resolve(undefined)
    }

    this.logger.debug('Handler found for event type {event_type}', {
      event_type: headers.eventType,
    })

    const data = await handler.parseData(notification.Message)
    const envelope = { ...headers, data } as Envelope<Event>

    try {
      await withMessageSpan(headers.eventType, notification.MessageAttributes, () =>
        handler.handleEnvelope(envelope),
      )
    } catch (err) {
      this.logger.error(
        'Unhandled error during event handling for message {message_id} (event {event_type})',
        { err, message_id: message.MessageId, event_type: headers.eventType },
      )
      // Re-throw so SQS can retry and eventually route to the DLQ if configured.
      throw err
    }

    return {
      MessageId: message.MessageId,
    }
  }

  start(): void {
    this.logger.log('Starting consumer for queue {queue_url}', { queue_url: this.queueUrl })
    this.consumer.start()
  }

  stop(): void {
    this.logger.log('Stopping consumer for queue {queue_url}', { queue_url: this.queueUrl })
    this.consumer.stop()
  }

  parseHeaders(messageAttributes: MessageAttributes): Headers {
    function extractAttribute<T>(obj: MessageAttributes, key: string): T {
      const value = obj?.[key]?.Value ?? null
      if (value == null) {
        throw new Error(`Missing required attribute: ${key}`)
      }
      return value as T
    }

    return {
      eventId: extractAttribute<string>(messageAttributes, 'event_id'),
      eventType: extractAttribute<string>(messageAttributes, 'event_type'),
      publishedAt: new Date(extractAttribute<string>(messageAttributes, 'published_at')),
      source: extractAttribute<string>(messageAttributes, 'source'),
    }
  }
}
