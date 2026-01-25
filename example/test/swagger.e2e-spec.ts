import { setupSwagger } from '@metapic/nestjs-utils/swagger'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test, type TestingModule } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AppModule } from '@/app.module'

describe('OpenAPI', () => {
  let module: TestingModule
  let app: NestFastifyApplication

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    setupSwagger(app)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  it('should generate OpenAPI documentation using snake_case', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs-json',
    })

    expect(response.json()).toEqual({
      openapi: '3.0.0',
      paths: {
        '/cats': {
          get: {
            operationId: 'GetCats',
            parameters: [
              {
                name: 'page',
                required: false,
                in: 'query',
                description: 'The page number.',
                schema: { default: 1, type: 'number' },
              },
              {
                name: 'limit',
                required: false,
                in: 'query',
                description: 'The number of items per page.',
                schema: { default: 10, type: 'number' },
              },
              {
                name: 'age_greater_than',
                required: false,
                in: 'query',
                description: 'Filter cats with age greater than the specified value',
                schema: { type: 'number' },
              },
              {
                name: 'is_vaccinated',
                required: false,
                in: 'query',
                description: 'Filter cats by vaccination status',
                schema: { type: 'boolean' },
              },
            ],
            responses: {
              '200': {
                description: '',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/Paginated' },
                        {
                          properties: {
                            items: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/CatDto' },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            tags: ['Cats'],
          },
          post: {
            operationId: 'CreateCat',
            parameters: [],
            requestBody: {
              required: true,
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/CreateCatRequest' } },
              },
            },
            responses: {
              '201': {
                description: '',
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/CatDto' } },
                },
              },
            },
            tags: ['Cats'],
          },
        },
        '/cats/{id}': {
          get: {
            operationId: 'GetCat',
            parameters: [],
            responses: {
              '200': {
                description: '',
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/CatDto' } },
                },
              },
              '404': { description: 'Cat not found' },
            },
            tags: ['Cats'],
          },
        },
      },
      info: {
        title: '',
        description: '',
        version: '1.0.0',
        contact: {},
      },
      tags: [],
      servers: [],
      components: {
        schemas: {
          PaginationMeta: {
            type: 'object',
            properties: {
              item_count: {
                type: 'number',
                description: 'The amount of items on this specific page.',
              },
              total_items: {
                type: 'number',
                description: 'The total amount of items on all pages.',
              },
              items_per_page: { type: 'number', description: 'The amount of items on one page.' },
              total_pages: {
                type: 'number',
                description: 'The total amount of pages in this paginator.',
              },
              current_page: {
                type: 'number',
                description: 'The current page this paginator "points" to.',
              },
            },
            required: [
              'item_count',
              'total_items',
              'items_per_page',
              'total_pages',
              'current_page',
            ],
          },
          PaginationLinks: {
            type: 'object',
            properties: {
              first: { type: 'string', description: 'A link to the "first" page.', format: 'uri' },
              previous: {
                type: 'string',
                description: 'A link to the "previous" page.',
                format: 'uri',
              },
              next: { type: 'string', description: 'A link to the "next" page.', format: 'uri' },
              last: { type: 'string', description: 'A link to the "last" page.', format: 'uri' },
            },
            required: ['first', 'previous', 'next', 'last'],
          },
          Paginated: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'string' } },
              meta: { $ref: '#/components/schemas/PaginationMeta' },
              links: { $ref: '#/components/schemas/PaginationLinks' },
            },
            required: ['items', 'meta'],
          },
          CatDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              age: { type: 'number' },
              breed: {
                type: 'string',
                enum: ['bengal', 'birman', 'maine_coon', 'persian', 'siamese'],
              },
              is_vaccinated: { type: 'boolean' },
              magic_number: { type: 'number' },
              created_at: { format: 'date-time', type: 'string' },
            },
            required: ['id', 'name', 'age', 'breed', 'is_vaccinated', 'magic_number', 'created_at'],
          },
          CreateCatRequest: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              breed: {
                type: 'string',
                enum: ['bengal', 'birman', 'maine_coon', 'persian', 'siamese'],
              },
              is_vaccinated: { type: 'boolean', default: false },
              magic_number: { type: 'number' },
            },
            required: ['name', 'age', 'breed', 'magic_number'],
          },
        },
      },
    })
  })
})
