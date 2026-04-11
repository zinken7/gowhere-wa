/** Nitro / ofetch errors often expose payload on `data`. */
export function messageFromFetchError(e: unknown, fallback: string): string {
  if (!e || typeof e !== 'object') {
    return fallback
  }
  const err = e as {
    data?: { error?: { message?: string } }
    statusMessage?: string
    message?: string
  }
  return (
    err.data?.error?.message
    ?? (err.statusMessage && String(err.statusMessage))
    ?? (err.message && String(err.message))
    ?? fallback
  )
}
