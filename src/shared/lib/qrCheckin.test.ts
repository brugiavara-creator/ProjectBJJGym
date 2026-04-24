import { describe, expect, it } from 'vitest'
import { buildCheckinValidationBody, getQrSecondsRemaining, getQrStatus, parseQrTokenPayload } from './qrCheckin'

describe('QR check-in helpers', () => {
  it('returns whole seconds remaining until expiry', () => {
    expect(getQrSecondsRemaining('2026-04-24T12:00:10.000Z', Date.parse('2026-04-24T12:00:00.100Z'))).toBe(10)
  })

  it('does not return negative remaining time', () => {
    expect(getQrSecondsRemaining('2026-04-24T12:00:00.000Z', Date.parse('2026-04-24T12:00:01.000Z'))).toBe(0)
  })

  it('formats active and expired QR status labels', () => {
    const now = Date.parse('2026-04-24T12:00:00.000Z')

    expect(getQrStatus('2026-04-24T12:01:05.000Z', now)).toEqual({ isExpired: false, label: '1:05' })
    expect(getQrStatus('2026-04-24T12:00:00.000Z', now)).toEqual({ isExpired: true, label: 'QR expirado' })
  })

  it('parses unsigned token payload for scanner UI state only', () => {
    const payload = {
      academyId: 'academy-1',
      expiresAt: '2026-04-24T12:10:00.000Z',
      nonce: 'ABC123',
      sessionId: 'session-1'
    }
    const payloadPart = window.btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

    expect(parseQrTokenPayload(`${payloadPart}.signature`)).toEqual(payload)
    expect(parseQrTokenPayload('not-a-token')).toBeNull()
  })

  it('builds a token payload for scanned QR values', () => {
    expect(buildCheckinValidationBody({ scannedValue: 'payload.signature' })).toEqual({ token: 'payload.signature' })
  })

  it('builds a normalized manual-code payload when no QR was scanned', () => {
    expect(buildCheckinValidationBody({ manualCode: ' ab12cd34 ' })).toEqual({ manualCode: 'AB12CD34' })
  })
})
