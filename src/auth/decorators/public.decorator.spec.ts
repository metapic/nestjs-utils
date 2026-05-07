import { describe, expect, it } from 'vitest'

import { IS_PUBLIC_TOKEN, Public } from './public.decorator.js'

describe('Public decorator', () => {
  it('sets IS_PUBLIC_TOKEN metadata to true on a method', () => {
    class TestController {
      @Public()
      route(this: void) {
        return null
      }
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_TOKEN, TestController.prototype.route) as boolean
    expect(metadata).toBe(true)
  })

  it('sets IS_PUBLIC_TOKEN metadata to true on a class', () => {
    @Public()
    class TestController {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_TOKEN, TestController) as boolean
    expect(metadata).toBe(true)
  })
})
