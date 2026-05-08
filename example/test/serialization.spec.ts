import { ExposeApiProperty } from '@metapic/nestjs-utils'
import { plainToInstance } from 'class-transformer'
import { describe, expect, it } from 'vitest'

class TestEventPayload {
  @ExposeApiProperty()
  testId: string

  @ExposeApiProperty()
  foo: string

  @ExposeApiProperty()
  bar: number

  @ExposeApiProperty()
  baz: boolean
}

describe('Serialization', () => {
  it('transforms plain object to TestEventPayload instance', () => {
    const data = plainToInstance(TestEventPayload, {
      testId: 'test-123',
      foo: 'foo-value',
      bar: 42,
      baz: true,
    })

    expect(data).toEqual({
      testId: 'test-123',
      foo: 'foo-value',
      bar: 42,
      baz: true,
    })
  })
})
