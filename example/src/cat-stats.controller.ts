import { ApiPaginatedResponse, Paginated, PaginatedParams } from '@metapic/nestjs-utils'
import { Controller, Get, Query } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { BreedCountDto, BreedCountProjection } from './cat.dto'
import { Cat } from './cat.entity'

@Controller('cat-stats')
export class CatStatsController {
  constructor(
    @InjectRepository(Cat)
    private repository: Repository<Cat>,
  ) {}

  @Get('breeds')
  @ApiPaginatedResponse({ type: BreedCountDto })
  async getBreedStats(@Query() params: PaginatedParams): Promise<Paginated<BreedCountDto>> {
    return await this.repository.manager
      .createQueryBuilder<BreedCountProjection>(Cat, 'cat')
      .select('cat.breed', 'breed')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cat.breed')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('cat.breed', 'ASC')
      .toPaginatedProjectionResponse(BreedCountDto.fromProjection, params)
  }
}
