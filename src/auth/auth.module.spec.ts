import { APP_GUARD } from '@nestjs/core'
import { describe, expect, it, vi } from 'vitest'

import { AuthModule } from './auth.module.js'
import { ApiKeyStrategy, USER_API_KEY_RESOLVER_TOKEN } from './strategies/api-key.strategy.js'
import { JwtStrategy, USER_JWT_RESOLVER_TOKEN } from './strategies/jwt.strategy.js'

describe('AuthModule.forRoot', () => {
  it('returns a DynamicModule with AuthModule as the module', () => {
    const module = AuthModule.forRoot()
    expect(module.module).toBe(AuthModule)
  })

  it('registers APP_GUARD by default (provideGlobalAuthGuard: true)', () => {
    const module = AuthModule.forRoot()
    const provider = module.providers?.find(
      (p) => typeof p === 'object' && 'provide' in p && p.provide === APP_GUARD,
    )
    expect(provider).toBeDefined()
  })

  describe('JWT', () => {
    it('includes JwtStrategy in providers when useJwt is true (default)', () => {
      const module = AuthModule.forRoot()
      expect(module.providers).toContain(JwtStrategy)
    })

    it('does not include JwtStrategy when useJwt is false', () => {
      const module = AuthModule.forRoot({ useJwt: false })
      expect(module.providers).not.toContain(JwtStrategy)
    })

    it('registers the userJwtResolver using useValue when an instance is provided', () => {
      const resolver = { findUserByJwt: vi.fn() }
      const module = AuthModule.forRoot({ userJwtResolver: resolver })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_JWT_RESOLVER_TOKEN,
      )
      expect(provider).toBeDefined()
      expect((provider as { useValue: unknown }).useValue).toBe(resolver)
    })

    it('registers the userJwtResolver using useClass when a class is provided', () => {
      class ResolverClass {
        findUserByJwt = vi.fn()
      }
      const module = AuthModule.forRoot({ userJwtResolver: ResolverClass })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_JWT_RESOLVER_TOKEN,
      )
      expect(provider).toBeDefined()
      expect((provider as { useClass: unknown }).useClass).toBe(ResolverClass)
    })

    it('does not register a userJwtResolver when none is provided', () => {
      const module = AuthModule.forRoot()
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_JWT_RESOLVER_TOKEN,
      )
      expect(provider).toBeUndefined()
    })
  })

  describe('API key', () => {
    it('includes ApiKeyStrategy in providers when useApiKey is true', () => {
      const module = AuthModule.forRoot({ useApiKey: true })
      expect(module.providers).toContain(ApiKeyStrategy)
    })

    it('does not include ApiKeyStrategy by default', () => {
      const module = AuthModule.forRoot()
      expect(module.providers).not.toContain(ApiKeyStrategy)
    })

    it('registers the userApiKeyResolver when useApiKey is true and resolver is provided', () => {
      const resolver = { findUserByApiKey: vi.fn() }
      const module = AuthModule.forRoot({ useApiKey: true, userApiKeyResolver: resolver })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_API_KEY_RESOLVER_TOKEN,
      )
      expect(provider).toBeDefined()
      expect((provider as { useValue: unknown }).useValue).toBe(resolver)
    })

    it('registers the userApiKeyResolver using useClass when a class is provided', () => {
      class ResolverClass {
        findUserByApiKey = vi.fn()
      }
      const module = AuthModule.forRoot({ useApiKey: true, userApiKeyResolver: ResolverClass })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_API_KEY_RESOLVER_TOKEN,
      )
      expect(provider).toBeDefined()
      expect((provider as { useClass: unknown }).useClass).toBe(ResolverClass)
    })

    it('does not register a userApiKeyResolver when useApiKey is false', () => {
      const resolver = { findUserByApiKey: vi.fn() }
      const module = AuthModule.forRoot({ useApiKey: false, userApiKeyResolver: resolver })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === USER_API_KEY_RESOLVER_TOKEN,
      )
      expect(provider).toBeUndefined()
    })
  })
})
