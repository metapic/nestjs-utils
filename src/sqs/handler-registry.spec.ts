import 'reflect-metadata'

import { describe, expect, it } from 'vitest'

import { HandlerRegistry } from './handler-registry.js'
import { type Handler } from './handler.js'
import { SQS_HANDLER, SqsHandler } from './sqs-handler.decorator.js'
import { type Event } from './types.js'

@SqsHandler('test.event')
class TestHandler {
  handle(): Promise<void> {
    return Promise.resolve()
  }
}

describe('SqsHandler decorator', () => {
  it('sets the SQS_HANDLER metadata on the class', () => {
    const metadata: unknown = Reflect.getMetadata(SQS_HANDLER, TestHandler)

    expect(metadata).toBe('test.event')
  })
})

describe('HandlerRegistry', () => {
  it('registers and retrieves a handler by event type', () => {
    const registry = new HandlerRegistry()
    const handler = {} as Handler<Event>
    registry.registerHandler('my.event', handler)

    expect(registry.getHandler('my.event')).toBe(handler)
  })

  it('returns null for unknown event types', () => {
    const registry = new HandlerRegistry()

    expect(registry.getHandler('unknown')).toBeNull()
  })

  it('throws when registering a duplicate event type', () => {
    const registry = new HandlerRegistry()
    registry.registerHandler('dup', {} as Handler<Event>)

    expect(() => registry.registerHandler('dup', {} as Handler<Event>)).toThrow(
      'Handler already registered for event type dup',
    )
  })
})
