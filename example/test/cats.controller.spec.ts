import { CatDto } from '@/cat.dto'
import { Cat } from '@/cat.entity'
import { CatsController } from '@/cats.controller'
import { TypedValidationResponse, VALIDATION_PIPE } from '@metapic/nestjs-utils'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CatsController', () => {
  let app: NestFastifyApplication
  const catRepository = {
    save: vi.fn(),
  }
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [
        {
          provide: getRepositoryToken(Cat),
          useValue: catRepository,
        },
        VALIDATION_PIPE,
      ],
    }).compile()
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    await app.init()
  })

  it('validates input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cats',
      body: {
        name: 'argh',
      },
    })
    expect.soft(response.statusCode).toBe(422)
    expect(response.json()).toEqual<TypedValidationResponse<CatDto>>({
      fieldErrors: {
        age: {
          errors: [
            {
              code: 'isNumber',
              message: 'age must be a number conforming to the specified constraints',
            },
            {
              code: 'isNotEmpty',
              message: 'age should not be empty',
            },
          ],
        },
        breed: {
          errors: [{ code: 'isNotEmpty', message: 'breed should not be empty' }],
        },
      },
    })
  })
})
