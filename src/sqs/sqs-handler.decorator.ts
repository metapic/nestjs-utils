import { SetMetadata } from '@nestjs/common'

export const SQS_HANDLER = 'SQS_HANDLER'

export function SqsHandler(eventType: string) {
  return SetMetadata(SQS_HANDLER, eventType)
}
