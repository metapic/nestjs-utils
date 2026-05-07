import {
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
  type Type,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IS_PUBLIC_TOKEN } from '../decorators/public.decorator.js'
import { SKIP_GUARDS_TOKEN } from '../decorators/skip-guards.decorator.js'

export const AUTH_GUARDS_TOKEN = Symbol('AUTH_GUARDS')
export const AUTH_EXCLUDED_PATHS_TOKEN = Symbol('AUTH_EXCLUDED_PATHS')

export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_GUARDS_TOKEN) private readonly guards: CanActivate[] = [],
    @Inject(AUTH_EXCLUDED_PATHS_TOKEN) private readonly excludedPaths: string[] = [],
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_TOKEN, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      this.logger.debug('Public route accessed, skipping authentication')
      return true
    }

    if (this.excludedPaths.length > 0) {
      const request = context.switchToHttp().getRequest<Request>()
      if (request?.url && this.excludedPaths.some((p) => request.url.startsWith(p))) {
        this.logger.debug('Excluded path accessed, skipping authentication')
        return true
      }
    }

    const skipped = this.reflector.getAllAndOverride<Type<CanActivate>[]>(SKIP_GUARDS_TOKEN, [
      context.getHandler(),
      context.getClass(),
    ])

    for (const guard of this.guards) {
      if (skipped?.some((cls) => guard instanceof cls)) {
        this.logger.debug('Guard {guard} skipped for this route', {
          guard: guard.constructor.name,
        })
        continue
      }

      try {
        const result = await guard.canActivate(context)
        if (result) {
          return true
        } else {
          this.logger.debug('Authentication failed for guard: {guard}', {
            guard: guard.constructor.name,
          })
        }
      } catch (err) {
        this.logger.debug('Authentication failed for guard: {guard}', {
          guard: guard.constructor.name,
          err,
        })
      }
    }

    throw new UnauthorizedException()
  }
}
