import { ExposeApiProperty, PaginatedParams } from '@metapic/nestjs-utils'

import { Breed, Cat } from './cat.entity'

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
