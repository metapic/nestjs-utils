import { describe, expect, it } from 'vitest'

import { buildQueueUrl, withPrefix, withSuffix } from './queue-url.js'

describe('withPrefix', () => {
  it('adds a prefix with the default separator', () => {
    expect(withPrefix('queue', 'tenant')).toBe('tenant/queue')
  })

  it('is idempotent', () => {
    expect(withPrefix('tenant/queue', 'tenant')).toBe('tenant/queue')
  })

  it('returns the value unchanged when prefix is undefined or empty', () => {
    expect(withPrefix('queue', undefined)).toBe('queue')
    expect(withPrefix('queue', '')).toBe('queue')
  })
})

describe('withSuffix', () => {
  it('adds a suffix with the default separator', () => {
    expect(withSuffix('queue', 'local')).toBe('queue-local')
  })

  it('is idempotent', () => {
    expect(withSuffix('queue-local', 'local')).toBe('queue-local')
  })

  it('returns the value unchanged when suffix is undefined or empty', () => {
    expect(withSuffix('queue', undefined)).toBe('queue')
    expect(withSuffix('queue', '')).toBe('queue')
  })
})

describe('buildQueueUrl', () => {
  it('composes prefix and suffix', () => {
    expect(buildQueueUrl('queue', { prefix: 'tenant', suffix: 'local' })).toBe('tenant/queue-local')
  })

  it('handles missing options', () => {
    expect(buildQueueUrl('queue')).toBe('queue')
    expect(buildQueueUrl('queue', {})).toBe('queue')
  })
})
