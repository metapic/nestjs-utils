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

## Testing

All testing runs through the example app’s e2e suite: [example/test](example/test).
