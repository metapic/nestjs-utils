import { type UserJwtResolver } from '@metapic/nestjs-utils/auth'
import { Injectable } from '@nestjs/common'

export class User {
  constructor(readonly id: string) {}
}

@Injectable()
export class UserRepository {
  findById(id: string): Promise<User | null> {
    return Promise.resolve(new User(id))
  }
}

@Injectable()
export class AuthService implements UserJwtResolver<User> {
  constructor(private readonly userRepository: UserRepository) {}

  async findUserByJwt(payload: Record<string, unknown>): Promise<User | null> {
    return await this.userRepository.findById(String(payload.sub))
  }
}
