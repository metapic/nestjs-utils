import { type CanActivate } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

export class ApiKeyAuthGuard extends AuthGuard('apiKey') implements CanActivate {}
