import { type ClassProvider, type ExistingProvider } from '@nestjs/common'
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
    it('includes a JwtStrategy provider when useJwt is true (default)', () => {
      const module = AuthModule.forRoot()
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === JwtStrategy,
      )

      expect(provider).toBeDefined()
    })

    it('does not include a JwtStrategy provider when useJwt is false', () => {
      const module = AuthModule.forRoot({ useJwt: false })
      const provider = module.providers?.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === JwtStrategy,
      )

      expect(provider).toBeUndefined()
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

  describe('extraAuthGuards', () => {
    it('registers a Type guard as APP_GUARD with useClass', () => {
      class ExtraGuard {
        canActivate() {
          return true
        }
      }
      const module = AuthModule.forRoot({ extraAuthGuards: [ExtraGuard] })

      const appGuardProviders = module.providers?.filter(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === APP_GUARD,
      )
      const hasExtraGuardAsAppGuard = appGuardProviders?.some(
        (p) => (p as ClassProvider).useClass === ExtraGuard,
      )

      expect(hasExtraGuardAsAppGuard).toBe(true)
    })

    it('registers a provider-object guard as APP_GUARD overriding its provide token', () => {
      class ExtraGuard {
        canActivate() {
          return true
        }
      }
      const guardProvider = { provide: ExtraGuard, useExisting: ExtraGuard }
      const module = AuthModule.forRoot({ extraAuthGuards: [guardProvider] })

      const appGuardProviders = module.providers?.filter(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === APP_GUARD,
      )
      const hasExtraGuardAsAppGuard = appGuardProviders?.some(
        (p) => (p as ExistingProvider).useExisting === ExtraGuard,
      )

      expect(hasExtraGuardAsAppGuard).toBe(true)
    })

    it('registers multiple Type guards as APP_GUARD', () => {
      class GuardA {
        canActivate() {
          return true
        }
      }
      class GuardB {
        canActivate() {
          return true
        }
      }
      const module = AuthModule.forRoot({ extraAuthGuards: [GuardA, GuardB] })

      const appGuardProviders = module.providers?.filter(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === APP_GUARD,
      )

      expect(appGuardProviders?.some((p) => (p as ClassProvider).useClass === GuardA)).toBe(true)
      expect(appGuardProviders?.some((p) => (p as ClassProvider).useClass === GuardB)).toBe(true)
    })

    it('does not add extra APP_GUARD entries when extraAuthGuards is not provided', () => {
      const module = AuthModule.forRoot()

      const appGuardProviders = module.providers?.filter(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === APP_GUARD,
      )

      expect(appGuardProviders?.length).toBe(1)
    })
  })
})
