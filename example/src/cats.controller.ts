import { ApiPaginatedResponse, Paginated, toPaginatedResponse } from '@metapic/nestjs-utils'
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { v7 as uuidv7 } from 'uuid'

import { CatDto, CreateCatRequest, GetCatsParams } from './cat.dto'
import { Cat } from './cat.entity'

@Controller('cats')
export class CatsController {
  constructor(
    @InjectRepository(Cat)
    private repository: Repository<Cat>,
  ) {}

  @Get()
  @ApiPaginatedResponse({ type: CatDto })
  async getCats(@Query() params: GetCatsParams): Promise<Paginated<CatDto>> {
    return await toPaginatedResponse<CatDto, Cat>(
      CatDto.fromEntity.bind(this),
      this.repository,
      params,
      {
        where: {
          ...(params.ageGreaterThan !== undefined && {
            age: MoreThan(params.ageGreaterThan),
          }),
          ...(params.isVaccinated !== undefined && {
            isVaccinated: params.isVaccinated,
          }),
        },
        order: { magicNumber: 'ASC' },
      },
    )
  }

  @Get(':id')
  @ApiOkResponse({ type: CatDto })
  @ApiNotFoundResponse({ description: 'Cat not found' })
  async getCat(@Param('id') id: string): Promise<CatDto> {
    const cat = await this.repository.findOneByOrFail({ id })
    return CatDto.fromEntity(cat)
  }

  @Post()
  @ApiCreatedResponse({ type: CatDto })
  async createCat(@Body() request: CreateCatRequest): Promise<CatDto> {
    const cat = new Cat()
    cat.id = uuidv7()
    cat.name = request.name
    cat.age = request.age
    cat.breed = request.breed
    cat.isVaccinated = request.isVaccinated ?? false
    cat.magicNumber = request.magicNumber ?? 100
    cat.createdAt = new Date()

    await this.repository.save(cat)

    return CatDto.fromEntity(cat)
  }
}
