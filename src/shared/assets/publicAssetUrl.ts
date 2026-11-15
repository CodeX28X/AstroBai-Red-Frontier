/** Public asset identity stays root-relative in data; deployment prefix is resolved at render time. */
export function publicAssetUrl(path: string | undefined, base = import.meta.env?.BASE_URL ?? '/'): string | undefined {
  if (!path || !path.startsWith('/assets/')) return path
  return `${base.replace(/\/$/, '')}${path}`
}
