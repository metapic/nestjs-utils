import { ViewColumn, ViewEntity } from '@metapic/nestjs-utils/typeorm'
import { DataSource } from 'typeorm'

import { Cat } from '@/cat.entity'

// View name defaults to `cat_breed_stats` (snake_case of the class name).
@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('cat.breed', 'breed')
      .addSelect('COUNT(*)', 'cat_count')
      .from(Cat, 'cat')
      .groupBy('cat.breed'),
})
export class CatBreedStats {
  @ViewColumn()
  breed!: string

  // Property is camelCase in TypeScript; column resolves to snake_case `cat_count`.
  // MySQL returns COUNT(*) as a string, so we coerce it back to a number on read.
  @ViewColumn({ transformer: { to: (value: number) => value, from: (value) => Number(value) } })
  catCount!: number
}
