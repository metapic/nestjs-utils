import { snakeCase } from 'change-case'
import { type ValidationError } from 'class-validator'

export type ValidationResponse = {
  errors?: ErrorInstance[]
  field_errors?: Record<string, ValidationResponse>
}

type ErrorInstance = {
  code: string
  message: string
}

function transformPropertyName(property: string): string {
  return snakeCase(property)
}

export function reduceErrors(errors: ValidationError[]): Record<string, ValidationResponse> {
  return errors.reduce<Record<string, ValidationResponse>>((accum, current) => {
    const exposedPropertyName = transformPropertyName(current.property)
    const fieldErrors = accum[exposedPropertyName] ?? {}
    if (current.constraints) {
      fieldErrors.errors = [
        ...(fieldErrors.errors ?? []),
        ...Object.keys(current.constraints).map((key) => ({
          code: key,
          message: current.constraints![key],
        })),
      ]
    }
    if (current.children?.length) {
      fieldErrors.field_errors = reduceErrors(current.children)
    }
    return {
      ...accum,
      [exposedPropertyName]: fieldErrors,
    }
  }, {})
}
