/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { type Repository } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AppModule } from './app.module'
import { Cat } from './cat.entity'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

describe('Cats API', () => {
  let module: TestingModule
  let app: NestFastifyApplication

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  beforeAll(async () => {
    await module.get<Repository<Cat>>(getRepositoryToken(Cat)).deleteAll()
  })

  describe('serialisation and deserialization', () => {
    let createResponses: Awaited<ReturnType<typeof app.inject>>[]
    let catIds: {
      whiskers: string
      fluffy: string
    }

    beforeAll(async () => {
      createResponses = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/cats',
          body: {
            name: 'Whiskers',
            age: 3,
            breed: 'SIAMESE',
            is_vaccinated: true,
            magic_number: 99999,
          },
        }),
        app.inject({
          method: 'POST',
          url: '/cats',
          body: {
            name: 'Fluffy',
            age: 8,
            breed: 'BIRMAN',
            magic_number: 1,
          },
        }),
      ])

      catIds = {
        whiskers: createResponses[0].json<{ id: string }>().id,
        fluffy: createResponses[1].json<{ id: string }>().id,
      }
    })

    it('should create a cat with snake_case request and response payloads', () => {
      expect(createResponses[0].statusCode).toBe(201)
      expect(createResponses[0].json()).toEqual({
        id: expect.stringMatching(uuidRegex),
        name: 'Whiskers',
        age: 3,
        breed: 'SIAMESE',
        is_vaccinated: true,
        magic_number: 99999,
        created_at: expect.stringMatching(isoDateTimeRegex),
      })
    })

    it('should get a cat with snake_case response payload', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/cats/${catIds.whiskers}`,
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        id: catIds.whiskers,
        name: 'Whiskers',
        age: 3,
        breed: 'siamese',
        is_vaccinated: true,
        magic_number: 99999,
        created_at: expect.stringMatching(isoDateTimeRegex),
      })
    })

    it('should list cats with snake_case response payload', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/cats',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            age: 8,
            breed: 'birman',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex),
          },
          {
            id: catIds.whiskers,
            name: 'Whiskers',
            age: 3,
            breed: 'siamese',
            is_vaccinated: true,
            magic_number: 99999,
            created_at: expect.stringMatching(isoDateTimeRegex),
          },
        ],
        meta: {
          current_page: 1,
          item_count: 2,
          items_per_page: 10,
          total_items: 2,
          total_pages: 1,
        },
      })
    })

    it('should respect pagination params', async () => {
      const pageOneResponse = await app.inject({
        method: 'GET',
        url: '/cats',
        query: { page: '1', limit: '1' },
      })
      expect(pageOneResponse.statusCode).toBe(200)
      expect(pageOneResponse.json()).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            age: 8,
            breed: 'birman',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex),
          },
        ],
        meta: {
          current_page: 1,
          item_count: 1,
          items_per_page: 1,
          total_items: 2,
          total_pages: 2,
        },
      })

      const pageTwoResponse = await app.inject({
        method: 'GET',
        url: '/cats',
        query: { page: '2', limit: '1' },
      })
      expect(pageTwoResponse.statusCode).toBe(200)
      expect(pageTwoResponse.json()).toEqual({
        items: [
          {
            id: catIds.whiskers,
            name: 'Whiskers',
            age: 3,
            breed: 'siamese',
            is_vaccinated: true,
            magic_number: 99999,
            created_at: expect.stringMatching(isoDateTimeRegex),
          },
        ],
        meta: {
          current_page: 2,
          item_count: 1,
          items_per_page: 1,
          total_items: 2,
          total_pages: 2,
        },
      })
    })

    it('should respect filter params', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/cats',
        query: { age_greater_than: '5' },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            age: 8,
            breed: 'birman',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex),
          },
        ],
        meta: {
          current_page: 1,
          item_count: 1,
          items_per_page: 10,
          total_items: 1,
          total_pages: 1,
        },
      })
    })
  })
})
