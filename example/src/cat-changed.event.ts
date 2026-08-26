import { type Event } from '@metapic/nestjs-utils/sqs'
import { IsInt, IsString, IsUUID } from 'class-validator'

export class CatChangedEvent implements Event {
  @IsUUID()
  catId!: string

  @IsString()
  name!: string

  @IsInt()
  age!: number
}
