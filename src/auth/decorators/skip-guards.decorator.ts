import { type CanActivate, SetMetadata, type Type } from '@nestjs/common'

export const SKIP_GUARDS_TOKEN = Symbol('SKIP_GUARDS')

export const SkipGuards = (...guards: Type<CanActivate>[]) => SetMetadata(SKIP_GUARDS_TOKEN, guards)
