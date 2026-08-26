import {
  context,
  propagation,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  type TextMapGetter,
  trace,
} from '@opentelemetry/api'

type SnsMessageAttributes = Record<string, { Type: string; Value: string }> | undefined

const tracer = trace.getTracer('@metapic/nestjs-utils/sqs')

// SNS delivers message attributes as { Type, Value } objects; read the Value.
const attributeGetter: TextMapGetter<SnsMessageAttributes> = {
  keys: (carrier) => (carrier ? Object.keys(carrier) : []),
  get: (carrier, key) => carrier?.[key]?.Value,
}

/**
 * Run `fn` inside a CONSUMER span for a single SQS message. The span links to an
 * inbound `traceparent` carried in the SNS message attributes when present; otherwise
 * it roots its own trace. All work `fn` triggers nests under the span. Exceptions are
 * recorded and re-thrown so the caller keeps its SQS retry/DLQ behavior.
 */
export async function withMessageSpan<T>(
  eventType: string,
  attributes: SnsMessageAttributes,
  fn: () => Promise<T>,
): Promise<T> {
  const parentContext = propagation.extract(ROOT_CONTEXT, attributes, attributeGetter)
  const span = tracer.startSpan(
    `process ${eventType}`,
    {
      kind: SpanKind.CONSUMER,
      attributes: {
        'messaging.system': 'aws_sqs',
        'messaging.operation': 'process',
        'messaging.destination.name': eventType,
      },
    },
    parentContext,
  )

  try {
    return await context.with(trace.setSpan(parentContext, span), fn)
  } catch (err) {
    span.recordException(err as Error)
    span.setStatus({ code: SpanStatusCode.ERROR })
    throw err
  } finally {
    span.end()
  }
}
