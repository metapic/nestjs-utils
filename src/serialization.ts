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
export const ExposeApiProperty = (
  options?: ApiPropertyOptions & {
    groups?: ExposeOptions['groups']
  },
): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const { groups: _, ...rest } = options ?? {}
    ExposeSnakeCase(options)(target, propertyKey)
    ApiPropertySnakeCase(rest)(target, propertyKey)
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
