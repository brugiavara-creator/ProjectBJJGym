import { ApiError } from './http.ts'

export function requireEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new ApiError(500, 'server_error', `Variavel de ambiente obrigatoria ausente: ${name}.`)
  }

  return value
}
