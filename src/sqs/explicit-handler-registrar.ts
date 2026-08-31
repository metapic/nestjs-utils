import { Inject, Injectable, type OnModuleInit, type Type } from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'

import { HandlerRegistry } from './handler-registry.js'
import { type Handler } from './handler.js'
import { SQS_HANDLER } from './sqs-handler.decorator.js'
import { type Event, SQS_MODULE_OPTIONS, type SqsModuleOptions } from './types.js'

/**
 * Instantiates handler classes passed via {@link SqsModuleOptions.handlers}
 * using `moduleRef.create` and registers them in the {@link HandlerRegistry}.
 */
@Injectable()
export class ExplicitHandlerRegistrar implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
    private readonly handlerRegistry: HandlerRegistry,
    @Inject(SQS_MODULE_OPTIONS) private readonly options: SqsModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const handlerClass of this.options.handlers ?? []) {
      await this.register(handlerClass)
    }
  }

  private async register(handlerClass: Type<Handler<Event>>): Promise<void> {
    const eventType = this.reflector.get<string>(SQS_HANDLER, handlerClass)
    if (!eventType) {
      throw new Error(
        `Handler ${handlerClass.name} is missing the @SqsHandler decorator and cannot be registered`,
      )
    }
    const instance = await this.moduleRef.create(handlerClass)
    this.handlerRegistry.registerHandler(eventType, instance)
  }
}
