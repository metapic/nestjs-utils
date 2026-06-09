import { beforeEach, describe, expect, it } from 'vitest'

import { ApiKeyStrategy, type UserApiKeyResolver } from './api-key.strategy.js'

describe('ApiKeyStrategy', () => {
  const user = { id: '1' }
  const userResolver: UserApiKeyResolver<typeof user> = {
    findUserByApiKey(token: string) {
      return Promise.resolve(token === 'abcdef' ? user : null)
    },
  }

  let strategy: ApiKeyStrategy<typeof user>

  beforeEach(() => {
    strategy = new ApiKeyStrategy<typeof user>(userResolver)
  })

  it('returns the user when the resolver finds one', async () => {
    expect(await strategy.validate('abcdef')).toEqual(user)
  })

  it('returns null when the resolver returns null', async () => {
    expect(await strategy.validate('invalid')).toBeNull()
  })
})
