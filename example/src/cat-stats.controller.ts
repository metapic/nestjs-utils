import {
  pageOf,
  Paginated,
  PaginatedParams,
  toPaginatedProjectionResponse,
} from '@metapic/nestjs-utils'
import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { BreedCountDto } from './cat.dto'
import { Cat } from './cat.entity'

@Controller('cat-stats')
export class CatStatsController {
  constructor(
    @InjectRepository(Cat)
    private repository: Repository<Cat>,
  ) {}

  @Get('breeds')
  @ApiOkResponse({ type: pageOf(BreedCountDto) })
  async getBreedStats(@Query() params: PaginatedParams): Promise<Paginated<BreedCountDto>> {
    const queryBuilder = this.repository.manager
      .createQueryBuilder<{ breed: string; count: string }>(Cat, 'cat')
      .select('cat.breed', 'breed')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cat.breed')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('cat.breed', 'ASC')

    return await toPaginatedProjectionResponse(
      queryBuilder,
      (item) => BreedCountDto.fromProjection(item),
      params,
    )
  }
}
