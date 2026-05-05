import { applyDecorators, type Type } from '@nestjs/common'
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  ApiResponseNoStatusOptions,
  getSchemaPath,
} from '@nestjs/swagger'
import { IsOptional, Max, Min } from 'class-validator'
import {
  type IPaginationLinks,
  type IPaginationMeta,
  type IPaginationOptions,
  paginate,
  paginateRaw,
  Pagination,
} from 'nestjs-typeorm-paginate'
import {
  FindManyOptions,
  FindOptionsWhere,
  type ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm'

import { ExposeApiProperty, TransformEmptyString } from './serialization.js'

declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface SelectQueryBuilder<Entity extends ObjectLiteral> {
    toPaginatedResponse<Dto>(
      mapper: (entity: Entity) => Dto,
      paginationOptions: IPaginationOptions,
    ): Promise<Paginated<Dto>>

    toPaginatedResponse<Dto>(
      dto: { fromEntity(entity: Entity): Dto },
      paginationOptions: IPaginationOptions,
    ): Promise<Paginated<Dto>>

    toPaginatedProjectionResponse<Dto>(
      mapper: (entity: Entity) => Dto,
      paginationOptions: IPaginationOptions,
    ): Promise<Paginated<Dto>>

    toPaginatedProjectionResponse<Dto>(
      dto: { fromProjection(projection: Entity): Dto },
      paginationOptions: IPaginationOptions,
    ): Promise<Paginated<Dto>>
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Repository<Entity extends ObjectLiteral> {
    toPaginatedResponse<Dto>(
      mapper: (entity: Entity) => Dto,
      paginationOptions: IPaginationOptions,
      searchOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
    ): Promise<Paginated<Dto>>

    toPaginatedResponse<Dto>(
      dto: { fromEntity(entity: Entity): Dto },
      paginationOptions: IPaginationOptions,
      searchOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
    ): Promise<Paginated<Dto>>
  }
}

SelectQueryBuilder.prototype.toPaginatedProjectionResponse = async function <Dto>(
  this: SelectQueryBuilder<ObjectLiteral>,
  mapperOrDto:
    | ((entity: ObjectLiteral) => Dto)
    | { fromProjection(projection: ObjectLiteral): Dto },
  paginationOptions: IPaginationOptions,
): Promise<Paginated<Dto>> {
  const mapper =
    typeof mapperOrDto === 'function'
      ? mapperOrDto
      : (item: ObjectLiteral) => mapperOrDto.fromProjection(item)
  const result = await paginateRaw(this, paginationOptions)
  return new Pagination(
    result.items.map(mapper),
    new PaginationMeta(result.meta),
    result.links ? new PaginationLinks(result.links) : undefined,
  )
}

SelectQueryBuilder.prototype.toPaginatedResponse = async function <Dto>(
  this: SelectQueryBuilder<ObjectLiteral>,
  mapperOrDto: ((entity: ObjectLiteral) => Dto) | { fromEntity(entity: ObjectLiteral): Dto },
  paginationOptions: IPaginationOptions,
): Promise<Paginated<Dto>> {
  const mapper =
    typeof mapperOrDto === 'function'
      ? mapperOrDto
      : (item: ObjectLiteral) => mapperOrDto.fromEntity(item)
  const result = await paginate(this, paginationOptions)
  return new Pagination(
    result.items.map(mapper),
    new PaginationMeta(result.meta),
    result.links ? new PaginationLinks(result.links) : undefined,
  )
}

Repository.prototype.toPaginatedResponse = async function <Dto>(
  this: Repository<ObjectLiteral>,
  mapperOrDto: ((entity: ObjectLiteral) => Dto) | { fromEntity(entity: ObjectLiteral): Dto },
  paginationOptions: IPaginationOptions,
  searchOptions?: FindOptionsWhere<ObjectLiteral> | FindManyOptions<ObjectLiteral>,
): Promise<Paginated<Dto>> {
  const mapper =
    typeof mapperOrDto === 'function'
      ? mapperOrDto
      : (item: ObjectLiteral) => mapperOrDto.fromEntity(item)
  const result = await paginate(this, paginationOptions, searchOptions)
  return new Pagination(
    result.items.map(mapper),
    new PaginationMeta(result.meta),
    result.links ? new PaginationLinks(result.links) : undefined,
  )
}

export const ApiPaginatedResponse = (
  options: ApiResponseNoStatusOptions & { type: Type<unknown> },
): PropertyDecorator => {
  const { type, ...restOptions } = options
  return applyDecorators(
    ApiExtraModels(Paginated, type),
    ApiResponse({
      status: 200,
      ...restOptions,
      schema: {
        required: ['items', 'meta', 'links'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: getSchemaPath(type) },
          },
          meta: { $ref: getSchemaPath(PaginationMeta) },
          links: { $ref: getSchemaPath(PaginationLinks) },
        },
      },
    }),
  )
}

export class PaginationMeta implements IPaginationMeta {
  @ExposeApiProperty({
    description: 'The amount of items on this specific page.',
  })
  itemCount: number = 0

  @ExposeApiProperty({
    description: 'The total amount of items on all pages.',
  })
  totalItems?: number

  @ExposeApiProperty({
    description: 'The amount of items on one page.',
  })
  itemsPerPage: number = 0

  @ExposeApiProperty({
    description: 'The total amount of pages in this paginator.',
  })
  totalPages?: number

  @ExposeApiProperty({
    description: 'The current page this paginator "points" to.',
  })
  currentPage: number = 1

  constructor(source: PaginationMeta) {
    this.currentPage = source.currentPage
    this.itemCount = source.itemCount
    this.itemsPerPage = source.itemsPerPage
    this.totalItems = source.totalItems
    this.totalPages = source.totalPages
  }
}

export class PaginationLinks implements IPaginationLinks {
  @ExposeApiProperty({ description: 'A link to the "first" page.', format: 'uri' })
  @TransformEmptyString()
  first?: string

  @ExposeApiProperty({ description: 'A link to the "previous" page.', format: 'uri' })
  @TransformEmptyString()
  previous?: string

  @ExposeApiProperty({ description: 'A link to the "next" page.', format: 'uri' })
  @TransformEmptyString()
  next?: string

  @ExposeApiProperty({ description: 'A link to the "last" page.', format: 'uri' })
  @TransformEmptyString()
  last?: string

  constructor(source?: IPaginationLinks) {
    this.first = source?.first
    this.previous = source?.previous
    this.next = source?.next
    this.last = source?.last
  }
}

export class Paginated<T> extends Pagination<T, PaginationMeta> {
  @ApiProperty()
  declare readonly items: T[]

  @ApiProperty()
  declare readonly meta: PaginationMeta

  @ApiProperty({ required: false })
  declare readonly links?: PaginationLinks
}

export class PaginatedParams {
  @ExposeApiProperty({
    description: 'The page number.',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Min(1)
  page: number = 1

  @ExposeApiProperty({ description: 'The number of items per page.', default: 10, required: false })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit: number = 10
}
