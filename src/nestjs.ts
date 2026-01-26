import { ClassSerializerInterceptor, HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'

export const SERIALIZATION_INTERCEPTOR = {
  provide: APP_INTERCEPTOR,
  useClass: ClassSerializerInterceptor,
}

export const VALIDATION_PIPE = {
  provide: APP_PIPE,
  useValue: new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  }),
}
