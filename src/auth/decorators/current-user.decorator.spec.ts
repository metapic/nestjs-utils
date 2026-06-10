import { type ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js'
import { describe, expect, it, vi } from 'vitest'

import { CurrentUser } from './current-user.decorator.js'

const makeContext = (user: unknown): ExecutionContext =>
  ({
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({ user }),
    }),
  }) as unknown as ExecutionContext

const getFactory = () => {
  class TestController {
    test(@CurrentUser() _user: unknown) {
      // empty
    }
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'test') as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >
  return Object.values(metadata)[0].factory
}

const factory = getFactory()
const callDecorator = (options: Parameters<typeof CurrentUser>[0], ctx: ExecutionContext) =>
  factory(options, ctx)

describe('CurrentUser decorator', () => {
  it('returns the user from the request', () => {
    const user = { id: 1, name: 'Alice' }

    expect(callDecorator({}, makeContext(user))).toBe(user)
  })

  it('returns undefined when user is absent and required is false', () => {
    expect(callDecorator({ required: false }, makeContext(undefined))).toBeUndefined()
  })

  it('throws UnauthorizedException when user is absent and required is true (default)', () => {
    expect(() => callDecorator({}, makeContext(undefined))).toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user is absent and required is explicitly true', () => {
    expect(() => callDecorator({ required: true }, makeContext(undefined))).toThrow(
      UnauthorizedException,
    )
  })

  it('uses required: true as the default when no options are provided', () => {
    expect(() => callDecorator(undefined as unknown as object, makeContext(undefined))).toThrow(
      UnauthorizedException,
    )
  })
})
