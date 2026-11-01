import { createHmac, timingSafeEqual } from 'node:crypto'

/** Verifies the X-Hub-Signature-256 header using HMAC-SHA256 in constant time. */
export function verifyGithubSignature(rawBody: string, signatureHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !signatureHeader || !signatureHeader.startsWith('sha256=')) return false
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`)
  const actual = Buffer.from(signatureHeader)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function signGithubPayload(rawBody: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`
}
