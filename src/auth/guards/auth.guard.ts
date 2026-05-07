import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type Type,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IS_PUBLIC_TOKEN } from '../decorators/public.decorator.js'
import { SKIP_GUARDS_TOKEN } from '../decorators/skip-guards.decorator.js'

export const AUTH_GUARDS_TOKEN = Symbol('AUTH_GUARDS')
export const AUTH_EXCLUDED_PATHS_TOKEN = Symbol('AUTH_EXCLUDED_PATHS')

@Injectable()
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
      return true
    }

    if (this.excludedPaths.length > 0) {
      const request = context.switchToHttp().getRequest<Request>()
      if (request?.url && this.excludedPaths.some((p) => request.url.startsWith(p))) {
        return true
      }
    }

    const skipped = this.reflector.getAllAndOverride<Type<CanActivate>[]>(SKIP_GUARDS_TOKEN, [
      context.getHandler(),
      context.getClass(),
    ])

    for (const guard of this.guards) {
      if (skipped?.some((cls) => guard instanceof cls)) {
        continue
      }
      try {
        const result = await guard.canActivate(context)
        if (result) {
          return true
        }
      } catch (error) {
        this.logger.debug('Authentication failed for guard: {error}', {
          error: (error as Error).message,
        })
      }
    }

    throw new UnauthorizedException()
  }
}
