export type QrSessionResponse = {
  academyId: string
  expiresAt: string
  manualCode: string
  sessionId: string
  title: string
  token: string
  trainingDate: string
}

export type CheckinValidationResponse = {
  checkedInAt: string
  checkinId: string
  sessionTitle: string
  studentName: string
}

export type CheckinValidationRequest = {
  manualCode?: string
  token?: string
}

export type QrTokenPayload = {
  academyId: string
  expiresAt: string
  nonce: string
  sessionId: string
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = window.atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function parseQrTokenPayload(token: string): QrTokenPayload | null {
  const [payloadPart, signaturePart] = token.split('.')

  if (!payloadPart || !signaturePart || token.split('.').length !== 2) {
    return null
  }

  try {
    const value = JSON.parse(decodeBase64Url(payloadPart)) as Partial<QrTokenPayload>

    if (!value.academyId || !value.expiresAt || !value.nonce || !value.sessionId) {
      return null
    }

    return value as QrTokenPayload
  } catch {
    return null
  }
}

export function getQrSecondsRemaining(expiresAt: string, nowMs = Date.now()) {
  const expiresMs = new Date(expiresAt).getTime()

  if (!Number.isFinite(expiresMs)) {
    return 0
  }

  return Math.max(0, Math.ceil((expiresMs - nowMs) / 1000))
}

export function getQrStatus(expiresAt?: string | null, nowMs = Date.now()) {
  if (!expiresAt) {
    return { isExpired: true, label: 'QR indisponivel' }
  }

  const secondsRemaining = getQrSecondsRemaining(expiresAt, nowMs)

  if (secondsRemaining <= 0) {
    return { isExpired: true, label: 'QR expirado' }
  }

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60

  return {
    isExpired: false,
    label: `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

export function buildCheckinValidationBody(input: { manualCode?: string | null; scannedValue?: string | null }) {
  const scannedValue = input.scannedValue?.trim()

  if (scannedValue) {
    return { token: scannedValue } satisfies CheckinValidationRequest
  }

  return { manualCode: input.manualCode?.trim().toUpperCase() ?? '' } satisfies CheckinValidationRequest
}
