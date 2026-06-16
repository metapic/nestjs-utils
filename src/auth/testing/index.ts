import { randomUUID } from 'node:crypto'

import { type INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import jwt from 'jsonwebtoken'
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
  return jwt.sign(
    {
      sub: randomUUID().toString(),
      iss: config.getOrThrow<string>('auth.jwtIssuer'),
      aud: config.getOrThrow<string>('auth.jwtAudience'),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...extraPayload,
    },
    config.getOrThrow<string>('auth.jwtSecret'),
  )
}
