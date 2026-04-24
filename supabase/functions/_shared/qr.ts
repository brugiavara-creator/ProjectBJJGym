import { ApiError } from './http.ts'

export type QrTokenPayload = {
  academyId: string
  expiresAt: string
  nonce: string
  sessionId: string
}

const textEncoder = new TextEncoder()
const manualCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlEncodeText(value: string) {
  return base64UrlEncode(textEncoder.encode(value))
}

function base64UrlDecodeText(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { hash: 'SHA-256', name: 'HMAC' }, false, ['sign'])
}

async function hmacSha256(value: string, secret: string) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
  return base64UrlEncode(new Uint8Array(signature))
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createManualCode(length = 10) {
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomValues, (value) => manualCodeAlphabet[value % manualCodeAlphabet.length]).join('')
}

export async function signQrPayload(payload: QrTokenPayload, secret: string) {
  const payloadPart = base64UrlEncodeText(JSON.stringify(payload))
  const signature = await hmacSha256(payloadPart, secret)
  return `${payloadPart}.${signature}`
}

export async function verifyQrToken(token: string, secret: string) {
  const [payloadPart, signaturePart] = token.split('.')

  if (!payloadPart || !signaturePart || token.split('.').length !== 2) {
    throw new ApiError(400, 'bad_request', 'Token de QR invalido.')
  }

  const expectedSignature = await hmacSha256(payloadPart, secret)

  if (signaturePart !== expectedSignature) {
    throw new ApiError(403, 'forbidden', 'Token de QR invalido.')
  }

  const payload = JSON.parse(base64UrlDecodeText(payloadPart)) as Partial<QrTokenPayload>

  if (!payload.academyId || !payload.expiresAt || !payload.nonce || !payload.sessionId) {
    throw new ApiError(400, 'bad_request', 'Token de QR incompleto.')
  }

  return payload as QrTokenPayload
}
