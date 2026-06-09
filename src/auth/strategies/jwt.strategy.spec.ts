import { ExtractJwt } from 'passport-jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtStrategy, type UserJwtResolver } from './jwt.strategy.js'

const defaultOptions = {
  secretOrKey: 'test-secret',
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

describe('JwtStrategy', () => {
  describe('constructor', () => {
    it('creates an instance with secretOrKey options', () => {
      const strategy = new JwtStrategy({ findUserByJwt: vi.fn() }, defaultOptions)
      expect(strategy).toBeInstanceOf(JwtStrategy)
    })
  })

  describe('validate', () => {
    const user = { id: '1' }
    const userResolver: UserJwtResolver<typeof user> = {
      findUserByJwt(payload: Record<string, unknown>) {
        return payload.sub === 'abcdef' ? user : null
      },
    }

    let strategy: JwtStrategy<typeof user>

    beforeEach(() => {
      strategy = new JwtStrategy<typeof user>(userResolver, defaultOptions)
    })

    it('returns the user when the resolver finds one', () => {
      expect(strategy.validate({ sub: 'abcdef', iat: 1000 })).toBe(user)
    })

    it('returns null when the resolver returns null', () => {
      expect(strategy.validate({ sub: '42' })).toBeNull()
    })
  })
})
