import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'

type CurrentUserOptions = { required?: boolean }

export const CurrentUser = createParamDecorator(
  (options: CurrentUserOptions = {}, ctx: ExecutionContext) => {
    const { required = true } = options
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>()
    if (required && !request.user) {
      throw new UnauthorizedException()
    }
    return request.user
  },
)
