import { type CanActivate } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {}
