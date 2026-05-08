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
    const { groups, ...rest } = options ?? {}
    const exposedName = options?.name ?? snakeCase(String(propertyKey))
    // class-transformer's metadata storage keeps only one @Expose per property (later calls
    // overwrite earlier ones), so we cannot use separate toPlainOnly/toClassOnly @Expose entries
    // with different names. Use a single @Expose with the snake_case (or explicitly overridden)
    // name — this drives both serialization (instanceToPlain) and snake_case deserialization
    // (plainToInstance from snake_case payloads).
    Expose({ groups, name: exposedName })(target, propertyKey)
    // For deserialization from camelCase payloads (e.g. internal event payloads or
    // `excludeExtraneousValues: true` with the property's camelCase key), fall back to the
    // original property key when the exposed name is not present on the plain input.
    if (exposedName !== String(propertyKey)) {
      Transform(
        ({ value, obj }: { value: unknown; obj: Record<string, unknown> }) =>
          value !== undefined ? value : obj[String(propertyKey)],
        { toClassOnly: true },
      )(target, propertyKey)
    }
    ApiPropertySnakeCase(rest)(target, propertyKey)
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
