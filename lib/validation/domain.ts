// Supports multi-part TLDs like .com.tr, .co.uk, etc.
export const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/

export function isValidDomain(domain: string): boolean {
  // Remove protocol and www if present
  const cleaned = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')

  // Check if it matches the domain pattern
  if (!DOMAIN_REGEX.test(cleaned)) {
    return false
  }

  // Additional validation: at least one dot, valid length
  const parts = cleaned.split('.')
  if (parts.length < 2) return false
  if (cleaned.length > 253) return false

  // Each part should be valid
  for (const part of parts) {
    if (part.length === 0 || part.length > 63) return false
    if (part.startsWith('-') || part.endsWith('-')) return false
  }

  return true
}
