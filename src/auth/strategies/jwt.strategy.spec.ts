import * as fs from 'node:fs'

import { type ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtStrategy, type UserJwtResolver } from './jwt.strategy.js'

vi.mock('node:fs')

const makeConfig = (secret?: string, jwkPath?: string): ConfigService =>
  ({
    get: (key: string) => {
      if (key === 'jwt.secret') {
        return secret
      }
      if (key === 'jwt.jwkPath') {
        return jwkPath
      }
      return undefined
    },
  }) as unknown as ConfigService

describe('JwtStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('throws when neither jwt.secret nor jwt.jwkPath is configured', () => {
      expect(() => new JwtStrategy(makeConfig(), { findUserByJwt: vi.fn() })).toThrow(
        'Exactly one of jwt.secret or jwt.jwkPath must be provided.',
      )
    })

    it('throws when both jwt.secret and jwt.jwkPath are configured', () => {
      expect(
        () => new JwtStrategy(makeConfig('secret', '/path/to/jwk'), { findUserByJwt: vi.fn() }),
      ).toThrow('Exactly one of jwt.secret or jwt.jwkPath must be provided.')
    })

    it('creates an instance when jwt.secret is provided', () => {
      const strategy = new JwtStrategy(makeConfig('test-secret'), { findUserByJwt: vi.fn() })
      expect(strategy).toBeInstanceOf(JwtStrategy)
    })

    it('creates an instance and reads the jwk file when jwt.jwkPath is provided', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('jwk-content'))
      const strategy = new JwtStrategy(makeConfig(undefined, '/path/to/jwk-unique-1'), {
        findUserByJwt: vi.fn(),
      })
      expect(strategy).toBeInstanceOf(JwtStrategy)
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/jwk-unique-1')
    })

    it('caches the jwk file and does not re-read it on subsequent instantiations', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('jwk-content'))
      const resolver = { findUserByJwt: vi.fn() }
      new JwtStrategy(makeConfig(undefined, '/path/to/jwk-unique-2'), resolver)
      new JwtStrategy(makeConfig(undefined, '/path/to/jwk-unique-2'), resolver)
      expect(fs.readFileSync).toHaveBeenCalledTimes(1)
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
      strategy = new JwtStrategy<typeof user>(makeConfig('test-secret'), userResolver)
    })

    it('returns the user when the resolver finds one', () => {
      expect(strategy.validate({ sub: 'abcdef', iat: 1000 })).toBe(user)
    })

    it('returns null when the resolver returns null', () => {
      expect(strategy.validate({ sub: '42' })).toBeNull()
    })
  })
})
