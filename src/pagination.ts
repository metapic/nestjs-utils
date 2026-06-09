import { mixin } from '@nestjs/common'
import { ApiProperty, ApiSchema } from '@nestjs/swagger'
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
  type SelectQueryBuilder,
} from 'typeorm'

import { ExposeApiProperty, TransformEmptyString } from './serialization.js'

export async function toPaginatedProjectionResponse<Dto, Projection extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<Projection>,
  mapper: (projection: Projection) => Dto,
  paginationOptions: IPaginationOptions,
): Promise<Paginated<Dto>> {
  const result = await paginateRaw(queryBuilder, paginationOptions)
  return new Pagination(
    result.items.map(mapper),
    new PaginationMeta(result.meta),
    result.links ? new PaginationLinks(result.links) : undefined,
  )
}

export async function toPaginatedResponse<Dto, Entity extends ObjectLiteral>(
  mapper: (entity: Entity) => Dto,
  queryBuilder: SelectQueryBuilder<Entity>,
  paginationOptions: IPaginationOptions,
): Promise<Paginated<Dto>>

export async function toPaginatedResponse<Dto, Entity extends ObjectLiteral>(
  mapper: (entity: Entity) => Dto,
  repository: Repository<Entity>,
  paginationOptions: IPaginationOptions,
  searchOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
): Promise<Paginated<Dto>>

export async function toPaginatedResponse<Dto, Entity extends ObjectLiteral>(
  mapper: (entity: Entity) => Dto,
  queryBuilderOrRepository: SelectQueryBuilder<Entity> | Repository<Entity>,
  paginationOptions: IPaginationOptions,
  searchOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
): Promise<Paginated<Dto>> {
  let result

  if (queryBuilderOrRepository instanceof Repository) {
    result = await paginate(queryBuilderOrRepository, paginationOptions, searchOptions)
  } else {
    result = await paginate(queryBuilderOrRepository, paginationOptions)
  }

  return new Pagination(
    result.items.map(mapper),
    new PaginationMeta(result.meta),
    result.links ? new PaginationLinks(result.links) : undefined,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pageOf<T>(type: new (...args: any[]) => T) {
  @ApiSchema({ name: `PageOf${type.name}` })
  class PageOf extends Paginated<T> {
    @ExposeApiProperty({ type: [type] })
    declare items: T[]
  }
  return mixin(PageOf)
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
