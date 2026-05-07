import { beforeEach, describe, expect, it } from 'vitest'

import { ApiKeyStrategy, type UserApiKeyResolver } from './api-key.strategy.js'

describe('ApiKeyStrategy', () => {
  const user = { id: '1' }
  const userResolver: UserApiKeyResolver<typeof user> = {
    findUserByApiKey(token: string) {
      return token === 'abcdef' ? user : null
    },
  }

  let strategy: ApiKeyStrategy<typeof user>

  beforeEach(() => {
    strategy = new ApiKeyStrategy<typeof user>(userResolver)
  })

  it('returns the user when the resolver finds one', () => {
    expect(strategy.validate('abcdef')).toEqual(user)
  })

  it('returns null when the resolver returns null', () => {
    expect(strategy.validate('invalid')).toBeNull()
  })
})
