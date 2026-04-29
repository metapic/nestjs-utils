import { applyDecorators } from '@nestjs/common'
import { ApiProperty, type ApiPropertyOptions } from '@nestjs/swagger'
import { snakeCase } from 'change-case'
import { Expose, type ExposeOptions, Transform } from 'class-transformer'

export const TransformEmptyString = (defaultValue?: string): PropertyDecorator =>
  applyDecorators(
    Transform(({ value }): string | undefined => (value && value != '' ? value : defaultValue)),
  )

/**
 * Expose a property with snake_case naming in the API documentation and during serialization.
 *
 * @see Expose
 * @see ApiProperty
 */
export const ExposeApiProperty = (options?: {
  name?: string
  expose?: Omit<ExposeOptions, 'name'>
  apiProperty?: Omit<ApiPropertyOptions, 'name'>
}): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const { name, expose, apiProperty } = options ?? {}
    ExposeSnakeCase({ ...(expose ?? {}), name, toPlainOnly: true })(target, propertyKey)
    ApiPropertySnakeCase({ ...(apiProperty ?? {}), name } as ApiPropertyOptions)(
      target,
      propertyKey,
    )
  }
}

const ExposeSnakeCase = (options?: ExposeOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Expose({ ...options, name: options?.name ?? snakeCase(String(propertyKey)) })(
      target,
      propertyKey,
    )
  }
}

const ApiPropertySnakeCase = (options?: ApiPropertyOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    ApiProperty({ ...options, name: options?.name ?? snakeCase(String(propertyKey)) })(
      target,
      propertyKey,
    )
  }
}
