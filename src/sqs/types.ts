import { type Message, type SQSClient } from '@aws-sdk/client-sqs'
import { type ModuleMetadata, type Type } from '@nestjs/common'
import { IsDate, IsObject, IsString } from 'class-validator'
import { type ConsumerOptions } from 'sqs-consumer'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Event = {}

export type MessageAttributes = Record<string, { Type: string; Value: string }> | undefined

/** SNS JSON Notification structure, per AWS docs. */
export class SnsNotification {
  Type!: 'Notification'
  MessageId!: string
  TopicArn!: string
  Message!: string
  Timestamp!: string
  SignatureVersion!: string
  Signature!: string
  SigningCertURL!: string
  UnsubscribeURL!: string
  MessageAttributes?: Record<string, { Type: string; Value: string }>
}

export class Headers {
  @IsString()
  eventId!: string

  @IsString()
  eventType!: string

  @IsDate()
  publishedAt!: Date

  @IsString()
  source!: string
}

export class Envelope<T extends Event> extends Headers {
  @IsObject()
  data!: T
}

/** A queue to consume: either a full queue URL, or a name composed via prefix/suffix helpers. */
export type QueueConfig =
  | string
  | {
      name: string
      prefix?: string
      suffix?: string
      url?: never
    }
  | {
      url: string
      name?: never
      prefix?: never
      suffix?: never
    }

export type SqsModuleOptions = {
  /** Queues to consume. Each entry is a full URL or a `{ name, prefix?, suffix? }` spec. */
  queues: QueueConfig[]
  /** Custom endpoint (e.g. elasticmq/localstack). */
  endpoint?: string
  region?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
  /** Provide your own SQSClient instead of building one from endpoint/region/credentials. */
  sqsClient?: SQSClient
  /** Extra options passed through to each sqs-consumer Consumer. */
  consumerOptions?: Partial<
    Omit<ConsumerOptions, 'queueUrl' | 'sqs' | 'handleMessage' | 'handleMessageBatch'>
  >
}

export type SqsModuleAsyncOptions = {
  useFactory: (...args: never[]) => SqsModuleOptions | Promise<SqsModuleOptions>
  inject?: (Type | string | symbol)[]
} & Pick<ModuleMetadata, 'imports'>

export const SQS_MODULE_OPTIONS = Symbol('SQS_MODULE_OPTIONS')

export type { Message }
