import { randomUUID } from 'node:crypto'

import {
  CreateQueueCommand,
  DeleteQueueCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'
import { runConsumers, type SnsNotification, SqsModule } from '@metapic/nestjs-utils/sqs'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { type CatChangedEvent } from '@/cat-changed.event'
import { CatChangedHandler } from '@/cat-changed.handler'

const buildSnsEnvelope = (eventType: string, payload: object): string => {
  const notification: Partial<SnsNotification> = {
    Type: 'Notification',
    MessageId: `sns-${randomUUID()}`,
    TopicArn: 'arn:aws:sns:local:000000000000:cats',
    Message: JSON.stringify(payload),
    Timestamp: new Date().toISOString(),
    SignatureVersion: '1',
    Signature: 'stub',
    SigningCertURL: 'http://localhost/cert',
    UnsubscribeURL: 'http://localhost/unsub',
    // The consumer reads its headers from the SNS envelope's message attributes.
    MessageAttributes: {
      event_id: { Type: 'String', Value: `evt-${randomUUID()}` },
      event_type: { Type: 'String', Value: eventType },
      published_at: { Type: 'String', Value: new Date().toISOString() },
      source: { Type: 'String', Value: 'example' },
    },
  }
  return JSON.stringify(notification)
}

describe('SQS consumer (elasticmq)', () => {
  const endpoint = process.env.SQS_ENDPOINT ?? 'http://sqs:9324'

  let app: NestFastifyApplication
  let sqs: SQSClient
  let queueUrl: string
  let handler: CatChangedHandler

  beforeAll(async () => {
    sqs = new SQSClient({
      endpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      useQueueUrlAsEndpoint: true,
    })

    // Create a unique queue for this test run so no other suite or leftover
    // messages can interfere.
    const { QueueUrl } = await sqs.send(
      new CreateQueueCommand({ QueueName: `sqs-consumer-test-${randomUUID()}` }),
    )
    queueUrl = QueueUrl!

    const module = await Test.createTestingModule({
      imports: [
        SqsModule.forRoot({
          queues: [{ url: queueUrl }],
          endpoint,
          region: 'us-east-1',
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }),
      ],
      providers: [CatChangedHandler],
    }).compile()

    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    await app.init()

    handler = app.get(CatChangedHandler)

    // Mirrors main.ts: start the consumers once the app is ready.
    runConsumers(app)
  })

  afterAll(async () => {
    // Stops the consumers via onModuleDestroy, then remove the unique queue.
    await app.close()
    await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl }))
  })

  it('consumes an SNS-enveloped message and dispatches it to the handler', async () => {
    const payload: CatChangedEvent = {
      catId: randomUUID(),
      name: 'Whiskers',
      age: 4,
    }

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: buildSnsEnvelope('cat.changed', payload),
      }),
    )

    // Poll for this test's specific event (by id and name) and capture it in
    // one step, so concurrently-polled messages don't cause a stale read.
    let received: CatChangedEvent | undefined
    await vi.waitFor(
      () => {
        received = handler.received.find(
          (e) => e.catId === payload.catId && e.name === payload.name,
        )

        expect(received).toBeDefined()
      },
      { timeout: 8000, interval: 100 },
    )

    expect(received?.age).toBe(payload.age)
  }, 10000)

  it('consumes and discards messages with an unknown event type', async () => {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: buildSnsEnvelope('cat.unknown', { name: 'Ghost' }),
      }),
    )

    // Give the consumer a moment to pick up and discard the message. The unknown
    // event type has no registered handler, so no 'Ghost' event is recorded.
    await new Promise((resolve) => setTimeout(resolve, 1500))

    expect(handler.received.some((e) => e.name === 'Ghost')).toBe(false)
  })
})
