import { UUID_VALUE_TRANSFORMER } from '@metapic/nestjs-utils/typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, IsNull, type Repository } from 'typeorm'
import { v7 as uuidv7 } from 'uuid'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app, module } from './setup'

import { Breed, Cat } from '@/cat.entity'

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

  it('should find cats with null parentId using IsNull', async () => {
    const repository = module.get<Repository<Cat>>(getRepositoryToken(Cat))

    const catWithParent = new Cat({
      id: uuidv7(),
      name: 'Felix',
      age: 2,
      breed: Breed.BENGAL,
      isVaccinated: false,
      magicNumber: 1,
      createdAt: new Date(),
      parentId: uuidv7(),
    })
    await repository.save(catWithParent)

    const catWithoutParent = new Cat({
      id: uuidv7(),
      name: 'Luna',
      age: 4,
      breed: Breed.PERSIAN,
      isVaccinated: true,
      magicNumber: 2,
      createdAt: new Date(),
      parentId: null,
    })
    await repository.save(catWithoutParent)

    const catsWithNullParent = await repository.findBy({ parentId: IsNull() })

    expect(catsWithNullParent.length).toBeGreaterThanOrEqual(1)
    expect(catsWithNullParent.every((cat) => cat.parentId == null)).toBe(true)
    expect(catsWithNullParent.some((cat) => cat.name === 'Luna')).toBe(true)
    expect(catsWithNullParent.some((cat) => cat.name === 'Felix')).toBe(false)
  })

  it('should update cats with null parentId using IsNull', async () => {
    const repository = module.get<Repository<Cat>>(getRepositoryToken(Cat))

    const parentId = uuidv7()

    await repository.save(
      new Cat({
        id: uuidv7(),
        name: 'Mochi',
        age: 1,
        breed: Breed.BIRMAN,
        isVaccinated: false,
        magicNumber: 10,
        createdAt: new Date(),
        parentId: null,
      }),
    )

    await repository.update({ parentId: IsNull() }, { parentId })

    const stillNull = await repository.findBy({ parentId: IsNull() })
    const updated = await repository.findBy({ parentId })

    expect(stillNull.some((cat) => cat.name === 'Mochi')).toBe(false)
    expect(updated.some((cat) => cat.name === 'Mochi')).toBe(true)
    expect(updated.every((cat) => cat.parentId === parentId)).toBe(true)
  })
})
