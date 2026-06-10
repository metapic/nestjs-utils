import { createRequestAgent } from '@metapic/nestjs-utils/auth/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Response } from 'supertest'
import { type Repository } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app, module } from './setup'

import { Cat } from '@/cat.entity'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

describe('Serialization', () => {
  beforeAll(async () => {
    await module.get<Repository<Cat>>(getRepositoryToken(Cat)).deleteAll()
  })

  afterAll(async () => {
    await module.get<Repository<Cat>>(getRepositoryToken(Cat)).deleteAll()
  })

  let createResponses: Response[]
  let catIds: {
    whiskers: string
    fluffy: string
    blabby: string
  }

  beforeAll(async () => {
    const agent = createRequestAgent(app)
    createResponses = await Promise.all([
      agent.post('/cats').send({
        name: 'Whiskers',
        age: 3,
        breed: 'SIAMESE',
        is_vaccinated: true,
        magic_number: 99999,
      }),
      agent.post('/cats').send({
        name: 'Fluffy',
        age: 8,
        breed: 'BIRMAN',
        magic_number: 1,
      }),
      agent.post('/cats').send({
        name: 'Blabby',
        age: 4,
        breed: 'BIRMAN',
        magic_number: 1,
      }),
    ])

    catIds = {
      whiskers: (createResponses[0].body as { id: string }).id,
      fluffy: (createResponses[1].body as { id: string }).id,
      blabby: (createResponses[2].body as { id: string }).id,
    }
  })

  describe('Cats API', () => {
    it('should create a cat with snake_case request and response payloads', () => {
      expect(createResponses[0].statusCode).toBe(201)
      expect(createResponses[0].body).toEqual({
        id: expect.stringMatching(uuidRegex) as string,
        name: 'Whiskers',
        breed: 'SIAMESE',
        legacy_name_still_in_use: 'Garfield',
        is_vaccinated: true,
        magic_number: 99999,
        created_at: expect.stringMatching(isoDateTimeRegex) as string,
      })
    })

    it('should get a cat with snake_case response payload', async () => {
      const response = await createRequestAgent(app).get(`/cats/${catIds.whiskers}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        id: catIds.whiskers,
        name: 'Whiskers',
        breed: 'siamese',
        is_vaccinated: true,
        magic_number: 99999,
        legacy_name_still_in_use: 'Garfield',
        created_at: expect.stringMatching(isoDateTimeRegex) as string,
      })
    })

    it('should get a cat serialized with a different group', async () => {
      const response = await createRequestAgent(app).get(`/cats/${catIds.whiskers}/with-private`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        id: catIds.whiskers,
        name: 'Whiskers',
        age: 3,
        breed: 'siamese',
        legacy_name_still_in_use: 'Garfield',
        is_vaccinated: true,
        magic_number: 99999,
        created_at: expect.stringMatching(isoDateTimeRegex) as string,
      })
    })

    it('should list cats with snake_case response payload', async () => {
      const response = await createRequestAgent(app).get('/cats')

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            breed: 'birman',
            legacy_name_still_in_use: 'Garfield',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
          {
            id: catIds.blabby,
            name: 'Blabby',
            breed: 'birman',
            legacy_name_still_in_use: 'Garfield',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
          {
            id: catIds.whiskers,
            name: 'Whiskers',
            breed: 'siamese',
            legacy_name_still_in_use: 'Garfield',
            is_vaccinated: true,
            magic_number: 99999,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
        ],
        meta: {
          current_page: 1,
          item_count: 3,
          items_per_page: 10,
          total_items: 3,
          total_pages: 1,
        },
      })
    })

    it('should respect pagination params', async () => {
      const pageOneResponse = await createRequestAgent(app)
        .get('/cats')
        .query({ page: '1', limit: '1' })

      expect(pageOneResponse.statusCode).toBe(200)
      expect(pageOneResponse.body).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            breed: 'birman',
            legacy_name_still_in_use: 'Garfield',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
        ],
        meta: {
          current_page: 1,
          item_count: 1,
          items_per_page: 1,
          total_items: 3,
          total_pages: 3,
        },
      })

      const pageTwoResponse = await createRequestAgent(app)
        .get('/cats')
        .query({ page: '2', limit: '1' })

      expect(pageTwoResponse.statusCode).toBe(200)
      expect(pageTwoResponse.body).toEqual({
        items: [
          {
            id: catIds.blabby,
            name: 'Blabby',
            breed: 'birman',
            is_vaccinated: false,
            legacy_name_still_in_use: 'Garfield',
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
        ],
        meta: {
          current_page: 2,
          item_count: 1,
          items_per_page: 1,
          total_items: 3,
          total_pages: 3,
        },
      })

      const pageThree = await createRequestAgent(app).get('/cats').query({ page: '3', limit: '1' })

      expect(pageThree.statusCode).toBe(200)
      expect(pageThree.body).toEqual({
        items: [
          {
            id: catIds.whiskers,
            name: 'Whiskers',
            breed: 'siamese',
            is_vaccinated: true,
            legacy_name_still_in_use: 'Garfield',
            magic_number: 99999,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
          },
        ],
        meta: {
          current_page: 3,
          item_count: 1,
          items_per_page: 1,
          total_items: 3,
          total_pages: 3,
        },
      })
    })

    it('should respect filter params', async () => {
      const response = await createRequestAgent(app).get('/cats').query({ age_greater_than: '5' })

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        items: [
          {
            id: catIds.fluffy,
            name: 'Fluffy',
            breed: 'birman',
            legacy_name_still_in_use: 'Garfield',
            is_vaccinated: false,
            magic_number: 1,
            created_at: expect.stringMatching(isoDateTimeRegex) as string,
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

  describe('Cat Stats API', () => {
    it('should return breed counts ordered by count descending', async () => {
      const response = await createRequestAgent(app).get('/cat-stats/breeds')

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        items: [
          {
            breed: 'birman',
            count: 2,
          },
          {
            breed: 'siamese',
            count: 1,
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

    it('should respect pagination params on breed stats', async () => {
      const response = await createRequestAgent(app)
        .get('/cat-stats/breeds')
        .query({ page: '1', limit: '1' })

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        items: [
          {
            breed: 'birman',
            count: 2,
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
    })
  })
})
