import { ApiError } from './http.ts'

export function optionalString(body: Record<string, unknown>, key: string) {
  const value = body[key]

  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, 'bad_request', `Campo ${key} deve ser texto.`)
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function optionalPositiveInteger(body: Record<string, unknown>, key: string) {
  const value = body[key]

  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ApiError(400, 'bad_request', `Campo ${key} deve ser inteiro positivo.`)
  }

  return value
}
