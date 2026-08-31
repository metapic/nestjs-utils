import 'reflect-metadata'

import { type Type } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'

import { ExplicitHandlerRegistrar } from './explicit-handler-registrar.js'
import { HandlerRegistry } from './handler-registry.js'
import { type Handler } from './handler.js'
import { SqsHandler } from './sqs-handler.decorator.js'
import { SqsModule } from './sqs.module.js'
import { type Event } from './types.js'

@SqsHandler('explicit.event')
class ExplicitTestHandler {
  handle(): Promise<void> {
    return Promise.resolve()
  }
}

class UndecoratedHandler {
  handle(): Promise<void> {
    return Promise.resolve()
  }
}

describe('ExplicitHandlerRegistrar', () => {
  it('is included in the providers of forRoot', () => {
    const module = SqsModule.forRoot({ queues: [] })

    expect(module.providers).toContain(ExplicitHandlerRegistrar)
  })

  it('is included in the providers of forRootAsync', () => {
    const module = SqsModule.forRootAsync({ useFactory: () => ({ queues: [] }) })

    expect(module.providers).toContain(ExplicitHandlerRegistrar)
  })

  it('instantiates explicit handlers via moduleRef.create and registers them', async () => {
    const module = await Test.createTestingModule({
      imports: [SqsModule.forRoot({ queues: [], handlers: [ExplicitTestHandler] })],
    }).compile()
    await module.init()

    const registry = module.get(HandlerRegistry)
    const handler = registry.getHandler('explicit.event')

    expect(handler).toBeInstanceOf(ExplicitTestHandler)

    await module.close()
  })

  it('explicit handler instances are not Nest providers', async () => {
    const module = await Test.createTestingModule({
      imports: [SqsModule.forRoot({ queues: [], handlers: [ExplicitTestHandler] })],
    }).compile()
    await module.init()

    expect(() => module.get(ExplicitTestHandler)).toThrow()

    await module.close()
  })

  it('throws on init when an explicit handler is missing the @SqsHandler decorator', async () => {
    const module = await Test.createTestingModule({
      imports: [
        SqsModule.forRoot({
          queues: [],
          handlers: [UndecoratedHandler as unknown as Type<Handler<Event>>],
        }),
      ],
    }).compile()

    const registrar = module.get(ExplicitHandlerRegistrar)

    await expect(registrar.onModuleInit()).rejects.toThrow(
      'Handler UndecoratedHandler is missing the @SqsHandler decorator and cannot be registered',
    )

    await module.close()
  })

  it('does nothing when no explicit handlers are configured', async () => {
    const module = await Test.createTestingModule({
      imports: [SqsModule.forRoot({ queues: [] })],
    }).compile()
    await module.init()

    expect(module.get(HandlerRegistry).getHandler('explicit.event')).toBeNull()

    await module.close()
  })

  it('throws when an explicit handler duplicates an already registered event type', async () => {
    const module = await Test.createTestingModule({
      imports: [SqsModule.forRoot({ queues: [], handlers: [ExplicitTestHandler] })],
    }).compile()
    await module.init()

    const registry = module.get(HandlerRegistry)

    expect(() => registry.registerHandler('explicit.event', {} as Handler<Event>)).toThrow(
      'Handler already registered for event type explicit.event',
    )

    await module.close()
  })
})
