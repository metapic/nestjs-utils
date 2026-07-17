# nestjs-utils

Utility helpers for [Nest.js](https://nestjs.com/) projects. Comes with opinionated defaults for [TypeORM](https://typeorm.io/), [Swagger](https://docs.nestjs.com/openapi/introduction) and serialisation:

- Symbols (e.g. DTO property names) always **camelCase**.
- API JSON payload property names always **snake_case**.
- Database column names always **snake_case**.

See the [example app](./example) for a fully wired showcase of all features.

**Important**: Serialisation uses [class-transformer](https://github.com/typestack/class-transformer)/[class-validator](https://github.com/typestack/class-validator) (see [Nest.js docs](https://docs.nestjs.com/techniques/serialization)). You can use the following helpers for easy setup (see also [`example/src/app.module.ts`](./example/src/app.module.ts))

```ts
import { Module } from '@nestjs/common'
import { SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE } from '@metapic/nestjs-utils'

@Module({
  providers: [SERIALIZATION_INTERCEPTOR, VALIDATION_PIPE],
})
export class AppModule {}
```

## TypeORM views

`ViewEntity` and `ViewColumn` (from `@metapic/nestjs-utils/typeorm`) wrap TypeORM's decorators and apply the same snake_case convention as `Column`: the view name is derived from the class name and each column name from its property key, unless you pass an explicit `name`. The derived view name is prefixed with `v_` by default - override it with `prefix: 'view_'` or disable it with `prefix: ''`.

```ts
import { ViewColumn, ViewEntity } from '@metapic/nestjs-utils/typeorm'
import { DataSource } from 'typeorm'

import { Cat } from './cat.entity'
@ViewEntity({
  // View name defaults to `v_cat_breed_stats`
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

  // Column name defaults to `cat_count` (snake_case of the property).
  @ViewColumn()
  catCount!: number
}
```

## Testing

All testing runs through the example app’s e2e suite: [example/test](example/test).
