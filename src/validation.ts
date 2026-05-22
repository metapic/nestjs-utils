import { type ValidationError } from 'class-validator'

export type ValidationResponse = {
  errors?: ErrorInstance[]
  fieldErrors?: Record<string, ValidationResponse>
}

type ErrorInstance = {
  code: string
  message: string
}

export type TypedValidationResponse<T> = T extends object
  ? {
      errors?: ErrorInstance[]
      fieldErrors?: { [p in keyof T]+?: TypedValidationResponse<T[p]> }
    }
  : { errors?: ErrorInstance[] }

export function reduceErrors(errors: ValidationError[]): Record<string, ValidationResponse> {
  return errors.reduce<Record<string, ValidationResponse>>((accum, current) => {
    const fieldErrors = accum[current.property] ?? {}
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
      fieldErrors.fieldErrors = reduceErrors(current.children)
    }
    return {
      ...accum,
      [current.property]: fieldErrors,
    }
  }, {})
}
