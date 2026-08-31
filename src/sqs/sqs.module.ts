import { type DynamicModule, Module, type Provider } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'

import { ExplicitHandlerRegistrar } from './explicit-handler-registrar.js'
import { HandlerRegistryInitializer } from './handler-registry.init.js'
import { HandlerRegistry } from './handler-registry.js'
import { SqsConsumerService } from './sqs-consumer.service.js'
import { SQS_MODULE_OPTIONS, type SqsModuleAsyncOptions, type SqsModuleOptions } from './types.js'

@Module({
  imports: [DiscoveryModule],
})
export class SqsModule {
  static forRoot(options: SqsModuleOptions): DynamicModule {
    return {
      module: SqsModule,
      imports: [DiscoveryModule],
      providers: [{ provide: SQS_MODULE_OPTIONS, useValue: options }, ...SqsModule.coreProviders()],
      exports: SqsModule.coreExports(),
    }
  }

  static forRootAsync(options: SqsModuleAsyncOptions): DynamicModule {
    return {
      module: SqsModule,
      imports: [DiscoveryModule, ...(options.imports ?? [])],
      providers: [
        {
          provide: SQS_MODULE_OPTIONS,

          useFactory: options.useFactory as (...args: unknown[]) => unknown,
          inject: options.inject ?? [],
        },
        ...SqsModule.coreProviders(),
      ],
      exports: SqsModule.coreExports(),
    }
  }

  private static coreProviders(): Provider[] {
    return [
      HandlerRegistry,
      HandlerRegistryInitializer,
      ExplicitHandlerRegistrar,
      SqsConsumerService,
    ] as Provider[]
  }

  private static coreExports(): (Provider | symbol | string)[] {
    return [HandlerRegistry, SqsConsumerService]
  }
}
