import { Logger } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validateOrReject } from 'class-validator'

import { type Envelope, type Event } from './types.js'

export abstract class Handler<T extends Event> {
  protected readonly logger = new Logger(this.constructor.name)

  abstract getEventClass(): new () => T
  abstract handle(event: T): Promise<void>

  async handleEnvelope(envelope: Envelope<T>): Promise<void> {
    this.logger.log('Handling event of type {event_type} with id {event_id}', {
      event_type: envelope.eventType,
      event_id: envelope.eventId,
    })
    return await this.handle(envelope.data)
  }

  async parseData(json: string | null | undefined): Promise<T> {
    if (json === null || json === undefined) {
      return Promise.reject(new Error('Missing message body'))
    }

    const event = plainToInstance(this.getEventClass(), JSON.parse(json), {
      enableImplicitConversion: true,
    })

    await validateOrReject(event)
    return event
  }
}
