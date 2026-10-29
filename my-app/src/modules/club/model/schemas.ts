import type { Club } from './types'

export function isClub(value: unknown): value is Club {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string'
  )
}
