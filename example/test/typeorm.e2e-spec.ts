import { UUID_VALUE_TRANSFORMER } from '@metapic/nestjs-utils/typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, type Repository } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app, module } from './setup'

import { Cat } from '@/cat.entity'

describe('TypeORM', () => {
  let id: string

  beforeAll(async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cats',
      body: {
        name: 'Whiskers',
        age: 3,
        breed: 'SIAMESE',
        is_vaccinated: true,
        magic_number: 99999,
      },
    })

    id = response.json<{ id: string }>().id
  })

  afterAll(async () => {
    await module.get<Repository<Cat>>(getRepositoryToken(Cat)).deleteAll()
  })

  it('should use snake_case as column names (tmp query by name)', async () => {
    const dataSource = module.get(DataSource)
    const result = await dataSource.query<unknown>(
      `SELECT name, age, breed, is_vaccinated, magic_number
       FROM cat
       WHERE name = ?`,
      ['Whiskers'],
    )

    expect(result).toMatchObject([
      {
        name: 'Whiskers',
        age: 3,
        breed: 'siamese',
        is_vaccinated: 1,
        magic_number: 99999,
      },
    ])
  })

  it('should be able to query by binary uuid', async () => {
    const dataSource = module.get(DataSource)
    const result = await dataSource.query<unknown[]>(
      `SELECT id, name, age, breed, is_vaccinated, magic_number
       FROM cat
       WHERE id = ?`,
      [UUID_VALUE_TRANSFORMER.to(id)],
    )

    expect(result).toMatchObject([
      {
        id: UUID_VALUE_TRANSFORMER.to(id),
        name: 'Whiskers',
        age: 3,
        breed: 'siamese',
        is_vaccinated: 1,
        magic_number: 99999,
      },
    ])
  })
})
