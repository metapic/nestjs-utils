import { describe, expect, it } from 'vitest'

import { SqsModule } from './sqs.module.js'
import { SQS_MODULE_OPTIONS } from './types.js'

describe('SqsModule.forRoot', () => {
  it('returns a DynamicModule with SqsModule as the module', () => {
    const module = SqsModule.forRoot({ queues: ['http://sqs/q'] })

    expect(module.module).toBe(SqsModule)
  })

  it('provides the options under the SQS_MODULE_OPTIONS token', () => {
    const options = { queues: ['http://sqs/q'] }
    const module = SqsModule.forRoot(options)
    const provider = module.providers?.find(
      (p) => typeof p === 'object' && 'provide' in p && p.provide === SQS_MODULE_OPTIONS,
    )

    expect(provider).toBeDefined()
    expect((provider as { useValue: unknown }).useValue).toBe(options)
  })
})

describe('SqsModule.forRootAsync', () => {
  it('returns a DynamicModule with SqsModule as the module', () => {
    const module = SqsModule.forRootAsync({
      useFactory: () => ({ queues: [] }),
    })

    expect(module.module).toBe(SqsModule)
  })

  it('provides the options via the factory', () => {
    const useFactory = () => ({ queues: ['q'] })
    const module = SqsModule.forRootAsync({ useFactory })
    const provider = module.providers?.find(
      (p) => typeof p === 'object' && 'provide' in p && p.provide === SQS_MODULE_OPTIONS,
    )

    expect(provider).toBeDefined()
    expect((provider as { useFactory: unknown }).useFactory).toBe(useFactory)
  })
})
