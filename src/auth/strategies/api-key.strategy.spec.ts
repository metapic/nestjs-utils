import { UnauthorizedException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyStrategy } from './api-key.strategy.js'

describe('ApiKeyStrategy', () => {
  const mockResolver = { findUserByApiKey: vi.fn() }
  let strategy: ApiKeyStrategy<{ id: string }>

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new ApiKeyStrategy<{ id: string }>(mockResolver)
  })

  it('returns the user when the resolver finds one', () => {
    const user = { id: '1' }
    mockResolver.findUserByApiKey.mockReturnValue(user)

    expect(strategy.validate('valid-token')).toBe(user)
    expect(mockResolver.findUserByApiKey).toHaveBeenCalledWith('valid-token')
  })

  it('throws UnauthorizedException when the resolver returns null', () => {
    mockResolver.findUserByApiKey.mockReturnValue(null)

    expect(() => strategy.validate('invalid-token')).toThrow(UnauthorizedException)
  })
})
