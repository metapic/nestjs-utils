import { snakeCase } from 'change-case'
import * as typeorm from 'typeorm'
import {
  type ColumnOptions,
  type FindOperator,
  InstanceChecker,
  type PrimaryColumnOptions,
  type ValueTransformer,
} from 'typeorm'
import { parse, stringify, validate } from 'uuid'

// TypeORM does not re-export these option interfaces from its barrel, so we
// derive them from the decorator signatures instead.
type ViewEntityOptions = NonNullable<Parameters<typeof typeorm.ViewEntity>[1]>
type ViewColumnOptions = NonNullable<Parameters<typeof typeorm.ViewColumn>[0]>

export const Column = (options?: ColumnOptions) => {
  return (target: object, propertyKey: string | symbol) => {
    typeorm.Column({ name: snakeCase(String(propertyKey)), ...options })(target, propertyKey)
  }
}

export const PrimaryColumn = (options?: PrimaryColumnOptions) => {
  return (target: object, propertyKey: string | symbol) => {
    typeorm.PrimaryColumn({ name: snakeCase(String(propertyKey)), ...options })(target, propertyKey)
  }
}

/**
 * Marks a class as a TypeORM view entity, deriving the view name as a snake_case
 * version of the class name when `name` is not explicitly provided.
 *
 * @see typeorm.ViewEntity
 */
export const ViewEntity = (options?: ViewEntityOptions): ClassDecorator => {
  return (target) => {
    typeorm.ViewEntity({ name: snakeCase(target.name), ...options })(target)
  }
}

/**
 * Marks a class property as a view column, deriving the column name as a
 * snake_case version of the property key when `name` is not explicitly provided.
 *
 * @see typeorm.ViewColumn
 */
export const ViewColumn = (options?: ViewColumnOptions) => {
  return (target: object, propertyKey: string | symbol) => {
    typeorm.ViewColumn({ name: snakeCase(String(propertyKey)), ...options })(target, propertyKey)
  }
}

export const PrimaryBinaryUuidColumn = (): ReturnType<typeof PrimaryColumn> =>
  PrimaryColumn({
    type: 'binary',
    length: 16,
    generated: false,
    transformer: UUID_VALUE_TRANSFORMER,
    // Since MySQL cannot generate UUIDv7 natively, we disable automatic generation here.
    // default: () => 'UUID_TO_BIN(UUID())',
  })

export const BinaryUuidColumn = (
  options?: Omit<ColumnOptions, 'type' | 'length' | 'generated' | 'transformer'>,
): ReturnType<typeof Column> =>
  Column({
    type: 'binary',
    length: 16,
    generated: false,
    transformer: UUID_VALUE_TRANSFORMER,
    ...options,
  })

/**
 * Inspiration: https://github.com/typeorm/typeorm/issues/3187#issuecomment-2421286827
 * More details: https://github.com/typeorm/typeorm/issues/10542
 */
class UuidValueTransformer implements ValueTransformer {
  public to(
    value: string | undefined | null | FindOperator<unknown>,
  ): Buffer | FindOperator<unknown> | null {
    if (!value) {
      return null
    }

    if (InstanceChecker.isFindOperator(value)) {
      // Pass through FindOperators (e.g. IsNull()) without transforming
      return value
    }

    return Buffer.from(parse(value))
  }

  public from(bin: Buffer | undefined | null): string | null {
    if (!bin) {
      return null
    }

    // Handle case where TypeORM passes a string representation as buffer
    if (bin.length === 36) {
      const str = bin.toString('utf8')
      if (validate(str)) {
        return str
      }
    }

    return stringify(bin)
  }
}

export const UUID_VALUE_TRANSFORMER = new UuidValueTransformer()
