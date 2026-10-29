import type { CampaignNote } from './types'

export function isCampaignNote(value: unknown): value is CampaignNote {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'content' in value &&
    typeof value.content === 'string'
  )
}
