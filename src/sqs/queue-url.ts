/** Ensure `value` starts with `prefix`, joined by `separator`. Idempotent. */
export function withPrefix(value: string, prefix: string | undefined, separator = '/'): string {
  if (!prefix) {
    return value
  }
  return value.startsWith(`${prefix}${separator}`) ? value : `${prefix}${separator}${value}`
}

/** Ensure `value` ends with `suffix`, joined by `separator`. Idempotent. */
export function withSuffix(value: string, suffix: string | undefined, separator = '-'): string {
  if (!suffix) {
    return value
  }
  return value.endsWith(`${separator}${suffix}`) ? value : `${value}${separator}${suffix}`
}

/** Compose a queue name from a base name plus optional prefix/suffix. */
export function buildQueueUrl(
  name: string,
  options?: { prefix?: string; suffix?: string },
): string {
  return withSuffix(withPrefix(name, options?.prefix), options?.suffix)
}
