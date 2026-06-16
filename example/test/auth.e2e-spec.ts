import { createRequestAgent } from '@metapic/nestjs-utils/auth/testing'
import { describe, expect, it } from 'vitest'

import { app } from './setup'

describe('Auth', () => {
  describe('extraAuthGuards', () => {
    it('fails when x-api-version is set to 0.0.1', async () => {
      const agent = createRequestAgent(app)
      const response = await agent.get('/cats').set('x-api-version', '0.0.1')

      expect(response.statusCode).toBe(401)
    })
  })
})
