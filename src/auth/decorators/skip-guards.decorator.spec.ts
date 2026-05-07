import { type CanActivate } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import { SKIP_GUARDS_TOKEN, SkipGuards } from './skip-guards.decorator.js'

class GuardA implements CanActivate {
  canActivate() {
    return true
  }
}

class GuardB implements CanActivate {
  canActivate() {
    return true
  }
}

describe('SkipGuards decorator', () => {
  it('sets SKIP_GUARDS_TOKEN metadata with the provided guard classes on a method', () => {
    class TestController {
      @SkipGuards(GuardA)
      route(this: void) {
        return null
      }
    }

    const metadata = Reflect.getMetadata(
      SKIP_GUARDS_TOKEN,
      TestController.prototype.route,
    ) as (typeof GuardA)[]
    expect(metadata).toEqual([GuardA])
  })

  it('sets SKIP_GUARDS_TOKEN metadata with multiple guard classes on a method', () => {
    class TestController {
      @SkipGuards(GuardA, GuardB)
      route(this: void) {
        return null
      }
    }

    const metadata = Reflect.getMetadata(SKIP_GUARDS_TOKEN, TestController.prototype.route) as (
      | typeof GuardA
      | typeof GuardB
    )[]
    expect(metadata).toEqual([GuardA, GuardB])
  })

  it('sets SKIP_GUARDS_TOKEN metadata on a class', () => {
    @SkipGuards(GuardA)
    class TestController {}

    const metadata = Reflect.getMetadata(SKIP_GUARDS_TOKEN, TestController) as (typeof GuardA)[]
    expect(metadata).toEqual([GuardA])
  })

  it('sets SKIP_GUARDS_TOKEN metadata to an empty array when no guards are provided', () => {
    class TestController {
      @SkipGuards()
      route(this: void) {
        return null
      }
    }

    const metadata = Reflect.getMetadata(
      SKIP_GUARDS_TOKEN,
      TestController.prototype.route,
    ) as unknown[]
    expect(metadata).toEqual([])
  })
})
