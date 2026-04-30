import { ExposeApiProperty, PaginatedParams } from '@metapic/nestjs-utils'

import { Breed, Cat } from './cat.entity'

export class GetCatsParams extends PaginatedParams {
  @ExposeApiProperty({
    apiProperty: {
      required: false,
      description: 'Filter cats with age greater than the specified value',
    },
  })
  ageGreaterThan?: number

  @ExposeApiProperty({
    apiProperty: {
      required: false,
      description: 'Filter cats by vaccination status',
    },
  })
  isVaccinated?: boolean

  @ExposeApiProperty({
    name: 'legacy_name_that_cannot_change',
    apiProperty: { required: false },
  })
  newName!: string
}

export class CreateCatRequest {
  @ExposeApiProperty()
  name!: string

  @ExposeApiProperty()
  age!: number

  @ExposeApiProperty({ apiProperty: { enum: Breed } })
  breed!: Breed

  @ExposeApiProperty({ apiProperty: { required: false, default: false } })
  isVaccinated?: boolean = false

  @ExposeApiProperty()
  magicNumber?: number
}

export class CatDto {
  @ExposeApiProperty({ apiProperty: { format: 'uuid' } })
  id!: string

  @ExposeApiProperty()
  name!: string

  @ExposeApiProperty({
    expose: {
      groups: ['private'],
    },
  })
  age?: number

  @ExposeApiProperty({ apiProperty: { enum: Breed } })
  breed!: Breed

  @ExposeApiProperty()
  isVaccinated!: boolean

  @ExposeApiProperty()
  magicNumber!: number

  @ExposeApiProperty()
  createdAt!: Date

  @ExposeApiProperty({ name: 'legacy_name_still_in_use', apiProperty: { type: 'string' } })
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
