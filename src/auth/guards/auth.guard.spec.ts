import { type CanActivate, type ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IS_PUBLIC_TOKEN } from '../decorators/public.decorator.js'

import { AuthGuard } from './auth.guard.js'

const makeContext = (url = '/api/resource'): ExecutionContext =>
  ({
    getHandler: vi.fn().mockReturnValue(() => {
      // empty
    }),
    getClass: vi.fn().mockReturnValue(class {}),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({ url }),
    }),
  }) as unknown as ExecutionContext

describe('AuthGuard', () => {
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
  })

  describe('public routes', () => {
    it('returns true when route is marked @Public', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)
      const guard = new AuthGuard(reflector)
      const context = makeContext()

      expect(await guard.canActivate(context)).toBe(true)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_TOKEN, [
        context.getHandler(),
        context.getClass(),
      ])
    })
  })

  describe('excluded paths', () => {
    it('returns true when the request url starts with an excluded path', async () => {
      const guard = new AuthGuard(reflector, [], ['/health'])

      expect(await guard.canActivate(makeContext('/health/live'))).toBe(true)
    })

    it('returns true for exact excluded path match', async () => {
      const guard = new AuthGuard(reflector, [], ['/metrics'])

      expect(await guard.canActivate(makeContext('/metrics'))).toBe(true)
    })

    it('does not bypass auth for unrelated paths when exclusions are set', async () => {
      const guard = new AuthGuard(reflector, [], ['/health'])

      await expect(guard.canActivate(makeContext('/api/protected'))).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('guard chain', () => {
    it('returns true when the first inner guard succeeds', async () => {
      const inner: CanActivate = { canActivate: vi.fn().mockResolvedValue(true) }
      const guard = new AuthGuard(reflector, [inner])

      expect(await guard.canActivate(makeContext())).toBe(true)
    })

    it('moves to the next guard when a previous one throws', async () => {
      const failing: CanActivate = {
        canActivate: vi.fn().mockRejectedValue(new Error('auth failed')),
      }
      const succeeding: CanActivate = { canActivate: vi.fn().mockResolvedValue(true) }
      const guard = new AuthGuard(reflector, [failing, succeeding])

      expect(await guard.canActivate(makeContext())).toBe(true)
    })

    it('moves to the next guard when a previous one returns false', async () => {
      const failing: CanActivate = { canActivate: vi.fn().mockResolvedValue(false) }
      const succeeding: CanActivate = { canActivate: vi.fn().mockResolvedValue(true) }
      const guard = new AuthGuard(reflector, [failing, succeeding])

      expect(await guard.canActivate(makeContext())).toBe(true)
    })

    it('throws UnauthorizedException when no inner guards are provided', async () => {
      const guard = new AuthGuard(reflector)

      await expect(guard.canActivate(makeContext())).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when all inner guards fail', async () => {
      const failing1: CanActivate = {
        canActivate: vi.fn().mockRejectedValue(new Error('expired')),
      }
      const failing2: CanActivate = { canActivate: vi.fn().mockResolvedValue(false) }
      const guard = new AuthGuard(reflector, [failing1, failing2])

      await expect(guard.canActivate(makeContext())).rejects.toThrow(UnauthorizedException)
    })
  })
})
