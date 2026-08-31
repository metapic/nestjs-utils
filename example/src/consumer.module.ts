import { SqsModule } from '@metapic/nestjs-utils/sqs'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CatChangedHandler } from '@/cat-changed.handler'
import { ConfigurationModule } from '@/configuration.module'

/**
 * Lean module for the SQS worker process. It carries only the consumer
 * infrastructure (config + SQS module + handlers) and deliberately excludes the
 * web app's HTTP controllers, auth, and database wiring.
 */
@Module({
  imports: [
    ConfigurationModule,
    SqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const endpoint = config.get<string>('sqs.endpoint')
        const queues = config.get<string[]>('sqs.queues') ?? []
        return {
          // elasticmq exposes queues at {endpoint}/queue/{name}.
          queues: queues.map((name) => ({ url: `${endpoint}/queue/${name}` })),
          handlers: [CatChangedHandler],
          endpoint,
          region: 'us-east-1',
          credentials: endpoint ? { accessKeyId: 'local', secretAccessKey: 'local' } : undefined,
        }
      },
    }),
  ],
})
export class ConsumerAppModule {}
