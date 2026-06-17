import { applyDecorators } from '@nestjs/common'
import { ApiProperty, type ApiPropertyOptions } from '@nestjs/swagger'
import { snakeCase } from 'change-case'
import { Expose, type ExposeOptions, Transform } from 'class-transformer'

/**
 * Transform an empty string to `undefined` or a specified default value during deserialization.
 */
export const TransformEmptyString = (defaultValue?: string): PropertyDecorator =>
  applyDecorators(
    Transform(({ value }): string | undefined => (value && value != '' ? value : defaultValue)),
  )

/**
 * Expose a property with snake_case naming in the API documentation and during serialization.
 *
 * @see ExposeSnakeCase
 * @see ApiPropertySnakeCase
 */
export const ExposeApiProperty = (
  options?: ApiPropertyOptions & ExposeOptions,
): PropertyDecorator =>
  applyDecorators(
    ExposeSnakeCase(options),
    ApiPropertySnakeCase(omit(options, 'groups', 'toClassOnly', 'toPlainOnly', 'since', 'until')),
  )

/**
 * Applies the `Expose` decorator with a snake_case name derived from the property key,
 * if the `name` option is not explicitly provided.
 *
 * @see Expose
 */
export const ExposeSnakeCase = (options?: ExposeOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Expose({ ...options, name: options?.name ?? snakeCase(String(propertyKey)) })(
      target,
      propertyKey,
    )
  }
}

/**
 * Applies the `ApiProperty` decorator with a snake_case name derived from the property key,
 * if the `name` option is not explicitly provided.
 *
 * @see ApiProperty
 */
export const ApiPropertySnakeCase = (options?: ApiPropertyOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    ApiProperty({ ...options, name: options?.name ?? snakeCase(String(propertyKey)) })(
      target,
      propertyKey,
    )
  }
}

const omit = <T extends object, K extends keyof T>(
  obj: T | undefined,
  ...keys: K[]
): T | undefined => {
  if (obj === undefined) {
    return undefined
  }
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}
