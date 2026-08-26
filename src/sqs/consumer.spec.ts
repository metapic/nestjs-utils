import { type Message } from '@aws-sdk/client-sqs'
import { IsString } from 'class-validator'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Consumer } from './consumer.js'
import { HandlerRegistry } from './handler-registry.js'
import { Handler } from './handler.js'
import { type Event, SnsNotification } from './types.js'

vi.mock('sqs-consumer', () => {
  class MockConsumer {
    handlers: Record<string, (...args: unknown[]) => void> = {}
    on(event: string, cb: (...args: unknown[]) => void) {
      this.handlers[event] = cb
      return this
    }

    start() {
      return undefined
    }

    stop() {
      return undefined
    }
  }
  return { Consumer: MockConsumer }
})

class TestEvent implements Event {
  @IsString()
  name!: string
}

class TestHandler extends Handler<TestEvent> {
  handled: TestEvent[] = []

  getEventClass() {
    return TestEvent
  }

  handle(event: TestEvent): Promise<void> {
    this.handled.push(event)
    return Promise.resolve()
  }
}

const buildMessage = (
  eventType: string,
  payload: object,
  overrides?: Partial<Message>,
): Message => {
  const notification: Partial<SnsNotification> = {
    Type: 'Notification',
    MessageId: 'sns-msg-1',
    Message: JSON.stringify(payload),
    MessageAttributes: {
      event_id: { Type: 'String', Value: 'evt-1' },
      event_type: { Type: 'String', Value: eventType },
      published_at: { Type: 'String', Value: '2026-01-01T00:00:00Z' },
      source: { Type: 'String', Value: 'test' },
    },
  }
  return {
    MessageId: 'msg-1',
    Body: JSON.stringify(notification),
    ...overrides,
  }
}

describe('Consumer', () => {
  let registry: HandlerRegistry
  let handler: TestHandler
  let consumer: Consumer

  beforeEach(() => {
    registry = new HandlerRegistry()
    handler = new TestHandler()
    registry.registerHandler('test.event', handler)
    consumer = new Consumer('http://sqs/queue', {} as never, registry)
  })

  it('parses an SNS envelope and dispatches to the registered handler', async () => {
    const result = await consumer.handle(buildMessage('test.event', { name: 'Whiskers' }))

    expect(handler.handled).toHaveLength(1)
    expect(handler.handled[0].name).toBe('Whiskers')
    expect(result?.MessageId).toBe('msg-1')
  })

  it('rejects when the message body is missing', async () => {
    await expect(consumer.handle({ MessageId: 'x' })).rejects.toThrow('Message body is missing')
  })

  it('rejects when the body is not a valid SNS notification', async () => {
    await expect(
      consumer.handle({ MessageId: 'x', Body: JSON.stringify({ Type: 'Other' }) }),
    ).rejects.toThrow('not a valid SNS notification')
  })

  it('resolves without invoking a handler when the event type is unknown', async () => {
    const result = await consumer.handle(buildMessage('unknown.event', { name: 'x' }))

    expect(result).toBeUndefined()
    expect(handler.handled).toHaveLength(0)
  })

  it('rethrows handler errors so SQS can retry', async () => {
    const failing = new (class extends Handler<TestEvent> {
      getEventClass() {
        return TestEvent
      }

      handle(): Promise<void> {
        return Promise.reject(new Error('boom'))
      }
    })()
    const reg = new HandlerRegistry()
    reg.registerHandler('fail.event', failing)
    const c = new Consumer('http://sqs/queue', {} as never, reg)

    await expect(c.handle(buildMessage('fail.event', { name: 'x' }))).rejects.toThrow('boom')
  })

  it('parses headers from SNS message attributes', () => {
    const headers = consumer.parseHeaders({
      event_id: { Type: 'String', Value: 'id-1' },
      event_type: { Type: 'String', Value: 'some.type' },
      published_at: { Type: 'String', Value: '2026-02-02T10:00:00Z' },
      source: { Type: 'String', Value: 'svc' },
    })

    expect(headers).toEqual({
      eventId: 'id-1',
      eventType: 'some.type',
      publishedAt: new Date('2026-02-02T10:00:00Z'),
      source: 'svc',
    })
  })

  it('throws when a required header attribute is missing', () => {
    expect(() => consumer.parseHeaders(undefined)).toThrow('Missing required attribute')
  })
})
