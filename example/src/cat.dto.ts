import { ExposeApiProperty, PaginatedParams } from '@metapic/nestjs-utils'

import { Breed, Cat } from './cat.entity'

export class GetCatsParams extends PaginatedParams {
  @ExposeApiProperty({
    required: false,
    description: 'Filter cats with age greater than the specified value',
  })
  ageGreaterThan?: number

  @ExposeApiProperty({
    required: false,
    description: 'Filter cats by vaccination status',
  })
  isVaccinated?: boolean
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
    expose: {
      groups: ['private'],
    },
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

  static fromEntity(cat: Cat): CatDto {
    const dto = new CatDto()
    dto.id = cat.id
    dto.name = cat.name
    dto.age = cat.age
    dto.breed = cat.breed
    dto.isVaccinated = cat.isVaccinated
    dto.magicNumber = cat.magicNumber
    dto.createdAt = cat.createdAt
    return dto
  }
}
