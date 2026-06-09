import { randomUUID } from 'node:crypto'

import { type INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import request from 'supertest'

export const createRequestAgent = (
  app: INestApplication,
  extraPayload: Record<string, unknown> = {},
): ReturnType<typeof request.agent> => {
  return (
    request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .agent(app.getHttpServer())
      .set('Authorization', `Bearer ${createJwt(app, extraPayload)}`)
  )
}

export const createJwt = (
  app: INestApplication,
  extraPayload: Record<string, unknown> = {},
): string => {
  const config = app.get(ConfigService)
  const key = config.get<string>('jwt.secret')
  if (!key) {
    throw new Error('JWT secret is required for tests. Please set JWT_SECRET environment variable.')
  }

  return jwt.sign(
    {
      sub: randomUUID().toString(),
      iss: config.get<string>('jwt.issuer'),
      aud: config.get<string>('jwt.audience'),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...extraPayload,
    },
    key,
  )
}
