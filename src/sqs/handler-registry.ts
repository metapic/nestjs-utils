import { Injectable } from '@nestjs/common'

import { type Handler } from './handler.js'
import { type Event } from './types.js'

@Injectable()
export class HandlerRegistry {
  private readonly eventHandlers = new Map<string, Handler<Event>>()

  getHandler(eventType: string): Handler<Event> | null {
    return this.eventHandlers.get(eventType) ?? null
  }

  registerHandler(eventType: string, handler: Handler<Event>): void {
    if (this.eventHandlers.has(eventType)) {
      throw new Error(`Handler already registered for event type ${eventType}`)
    }
    this.eventHandlers.set(eventType, handler)
  }
}
