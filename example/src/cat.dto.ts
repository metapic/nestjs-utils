import { ExposeApiProperty, PaginatedParams } from '@metapic/nestjs-utils'

import { Breed, Cat } from '@/cat.entity'

export class GetCatsParams extends PaginatedParams {
  @ExposeApiProperty({
    description: 'Filter cats with age greater than the specified value',
    required: false,
  })
  ageGreaterThan?: number

  @ExposeApiProperty({
    required: false,
    description: 'Filter cats by vaccination status',
  })
  isVaccinated?: boolean

  @ExposeApiProperty({
    name: 'legacy_name_that_cannot_change',
    required: false,
  })
  newName!: string
}

export class CreateCatRequest {
  @ExposeApiProperty()
  name!: string

  @ExposeApiProperty()
  age!: number

  @ExposeApiProperty({ enum: Breed })
  breed!: Breed

  @ExposeApiProperty({ required: false, default: false })
  isVaccinated?: boolean = false

  @ExposeApiProperty()
  magicNumber?: number
}

export class CatDto {
  @ExposeApiProperty({ format: 'uuid' })
  id!: string

  @ExposeApiProperty()
  name!: string

  @ExposeApiProperty({
    groups: ['private'],
  })
  age?: number

  @ExposeApiProperty({ enum: Breed })
  breed!: Breed

  @ExposeApiProperty()
  isVaccinated!: boolean

  @ExposeApiProperty()
  magicNumber!: number

  @ExposeApiProperty()
  createdAt!: Date

  @ExposeApiProperty({
    name: 'legacy_name_still_in_use',
    type: 'string',
  })
  correctName = 'Garfield'

  constructor(
    id: string,
    name: string,
    age: number | undefined,
    breed: Breed,
    isVaccinated: boolean,
    magicNumber: number,
    createdAt: Date,
  ) {
    this.id = id
    this.name = name
    this.age = age
    this.breed = breed
    this.isVaccinated = isVaccinated
    this.magicNumber = magicNumber
    this.createdAt = createdAt
  }

  static fromEntity(cat: Cat): CatDto {
    return new CatDto(
      cat.id,
      cat.name,
      cat.age,
      cat.breed,
      cat.isVaccinated,
      cat.magicNumber,
      cat.createdAt,
    )
  }
}

export type BreedCountProjection = {
  breed: string
  count: string
}

export class BreedCountDto {
  @ExposeApiProperty({ enum: Breed })
  breed!: Breed

  @ExposeApiProperty({ description: 'Count of cats for this breed' })
  count!: number

  static fromProjection(projection: BreedCountProjection): BreedCountDto {
    const dto = new BreedCountDto()
    dto.breed = projection.breed as Breed
    dto.count = Number(projection.count)
    return dto
  }
}
