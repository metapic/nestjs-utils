import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_TOKEN = Symbol('IS_PUBLIC')
export const Public = () => SetMetadata(IS_PUBLIC_TOKEN, true)
