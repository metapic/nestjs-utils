import { describe, expect, it } from 'vitest'

import { app } from './setup'

describe('OpenAPI', () => {
  it('should generate OpenAPI documentation using snake_case', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs-json',
    })

    expect(response.json()).toMatchSnapshot()
  })
})
