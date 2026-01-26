import { snakeCase } from 'change-case'
import * as typeorm from 'typeorm'
import { type ColumnOptions, type PrimaryColumnOptions, type ValueTransformer } from 'typeorm'
import { parse, stringify, validate } from 'uuid'

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
  options: Omit<ColumnOptions, 'type' | 'length' | 'generated' | 'transformer'>,
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
  public to(uuid: string | undefined | null): Buffer | null {
    if (!uuid) {
      return null
    }
    return Buffer.from(parse(uuid))
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

const UUID_VALUE_TRANSFORMER = new UuidValueTransformer()
