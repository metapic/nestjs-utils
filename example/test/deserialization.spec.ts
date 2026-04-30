import { plainToInstance } from 'class-transformer'
import { describe, expect, it } from 'vitest'

import { GetCatsParams } from '@/cat.dto'

describe('Deserialization', () => {
  describe('GetCatsParams', () => {
    it('transforms a plain object into a GetCatsParams instance', () => {
      const plain = {
        page: 2,
        limit: 20,
        age_greater_than: 5,
        is_vaccinated: true,
      }

      const result = plainToInstance(GetCatsParams, plain)

      expect(result).toBeInstanceOf(GetCatsParams)
      expect(result).toEqual({
        page: 2,
        limit: 20,
        ageGreaterThan: 5,
        isVaccinated: true,
      })
    })

    it('uses default values when optional fields are omitted', () => {
      const result = plainToInstance(GetCatsParams, {}, { exposeDefaultValues: true })

      expect(result).toBeInstanceOf(GetCatsParams)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.ageGreaterThan).toBeUndefined()
      expect(result.isVaccinated).toBeUndefined()
    })

    it('excludes extra properties if configured', () => {
      const result = plainToInstance(
        GetCatsParams,
        {
          legacy_name_that_cannot_change: 'Fluffy',
          doesnt_exist: true,
        },
        {
          excludeExtraneousValues: true,
        },
      )

      expect(result).toBeInstanceOf(GetCatsParams)
      expect(result).toEqual({
        newName: 'Fluffy',
      })
    })
  })
})
