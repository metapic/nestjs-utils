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
    const snakeCaseName = options?.name ?? snakeCase(String(propertyKey))
    if (options?.name !== undefined || snakeCaseName === String(propertyKey)) {
      // Either an explicit custom name was given, or the snake_case name is identical to the
      // property name (single-word properties like `page`, `foo`). In both cases it is safe to
      // expose in both transformation directions without risking an "overwrite-to-undefined" bug,
      // and we need both directions so that `excludeExtraneousValues` works correctly (the property
      // must appear in getExposedProperties(PLAIN_TO_CLASS) for class-transformer to process it and
      // override default values to undefined when the key is absent from the plain input).
      Expose({ groups, name: snakeCaseName, toClassOnly: true, toPlainOnly: true })(
        target,
        propertyKey,
      )
    } else {
      // Auto-generated snake_case name differs from the camelCase property name (e.g.
      // testId → test_id). Using toPlainOnly keeps the snake_case alias out of
      // getExposedProperties(PLAIN_TO_CLASS), so the snake_case key is never appended to the
      // iteration list for plainToInstance. Without this guard, a second loop iteration over
      // 'test_id' would resolve plain['test_id'] = undefined and silently overwrite the value
      // that was already correctly set from the camelCase key on the first iteration.
      // findExposeMetadataByCustomName still finds the toPlainOnly entry, so snake_case input
      // continues to work for plainToInstance without excludeExtraneousValues.
      ExposeSnakeCase({ groups, toPlainOnly: true })(target, propertyKey)
    }
    ApiPropertySnakeCase(rest)(target, propertyKey)
  }
}

const ExposeSnakeCase = (options?: ExposeOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Expose({
      ...options,
      name: options?.name ?? snakeCase(String(propertyKey)),
    })(target, propertyKey)
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
