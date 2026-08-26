import { Handler, SqsHandler } from '@metapic/nestjs-utils/sqs'
import { Injectable, Logger } from '@nestjs/common'

import { CatChangedEvent } from '@/cat-changed.event'

@Injectable()
@SqsHandler('cat.changed')
export class CatChangedHandler extends Handler<CatChangedEvent> {
  private readonly log = new Logger(CatChangedHandler.name)

  /** Events received, recorded so tests can observe handling. */
  readonly received: CatChangedEvent[] = []

  getEventClass() {
    return CatChangedEvent
  }

  handle(event: CatChangedEvent): Promise<void> {
    this.log.log(`Cat changed: ${event.name} (id=${event.catId}, age=${event.age})`)
    this.received.push(event)
    return Promise.resolve()
  }
}
