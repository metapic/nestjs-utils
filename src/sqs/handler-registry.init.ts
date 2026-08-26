import { Injectable, type OnModuleInit } from '@nestjs/common'
import { DiscoveryService, Reflector } from '@nestjs/core'

import { HandlerRegistry } from './handler-registry.js'
import { type Handler } from './handler.js'
import { SQS_HANDLER } from './sqs-handler.decorator.js'
import { type Event } from './types.js'

@Injectable()
export class HandlerRegistryInitializer implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly handlerRegistry: HandlerRegistry,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders()
    for (const wrapper of providers) {
      const { metatype } = wrapper
      if (!wrapper.instance || !metatype) {
        continue
      }
      const eventType = this.reflector.get<string>(SQS_HANDLER, metatype)
      if (eventType) {
        this.handlerRegistry.registerHandler(eventType, wrapper.instance as Handler<Event>)
      }
    }
  }
}
