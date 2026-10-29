export async function requestJson<T>(
  input: RequestInfo | URL,
  parse: (value: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  return parse(payload)
}
